/* ============================================================
   声纹 SOUNDPRINT · 拍照工位主流程（Step 2 / 5）
   待机 → 拍照(倒计时/重拍) → 选人格 → 选风格 → 留一句话(安全校验)
        → 上传临时图床 → Pollinations kontext 图生图 → Canvas 合成 → 揭晓
   每一步通过 SoundprintSync 发布状态，供 Step 3 大屏消费。
   ============================================================ */
(function () {
  "use strict";

  var Sync = window.SoundprintSync;
  var Safety = window.SoundprintSafety;
  var Poster = window.SoundprintPoster;

  var GENERATE_TIMEOUT = 150000; // kontext 生成可能较慢，150 秒超时
  var RETAKES_MAX = 1;

  var state = {
    stream: null,
    cameraOk: false,
    photoDataURL: null,   // 本地自拍（只用于生成，不上墙、不保留）
    retakesLeft: RETAKES_MAX,
    persona: null,
    style: null,
    nickname: "",
    line: "",
    serial: null,
    shareUrl: null,       // 海报二维码指向的分享页地址
    uploadedUrl: null,    // 已上传成功的临时图床地址（重试时复用）
    posterCanvas: null,
    posterDataURL: null,
    generating: false
  };

  /* ---------- 小工具 ---------- */
  function $(sel) { return document.querySelector(sel); }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(function (el) {
      el.classList.toggle("active", el.id === id);
    });
  }

  function currentScreen() {
    var el = document.querySelector(".screen.active");
    return el ? el.id : null;
  }

  function dataURLToBlob(dataURL) {
    var parts = dataURL.split(",");
    var mime = (parts[0].match(/:(.*?);/) || [])[1] || "image/jpeg";
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  /* ---------- 摄像头 ----------
     getUserMedia 只在 localhost / https 可用；被拒绝或环境不支持时
     降级为「相册选图」演示模式，不阻塞流程。 */
  function initCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onCameraFail();
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: "user" }, audio: false })
      .then(function (stream) {
        state.stream = stream;
        state.cameraOk = true;
        ["#idle-video", "#shoot-video"].forEach(function (sel) {
          var v = $(sel);
          if (v) v.srcObject = stream;
        });
        ["#idle-cam-fallback", "#shoot-cam-fallback"].forEach(function (sel) {
          var el = $(sel);
          if (el) el.hidden = true;
        });
      })
      .catch(onCameraFail);
  }

  function onCameraFail() {
    state.cameraOk = false;
    ["#idle-cam-fallback", "#shoot-cam-fallback"].forEach(function (sel) {
      var el = $(sel);
      if (el) el.hidden = false;
    });
    var shutter = $("#btn-shutter");
    if (shutter) shutter.disabled = true;
  }

  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach(function (t) { t.stop(); });
      state.stream = null;
    }
  }

  /* ---------- 拍照 ---------- */
  function startCountdown() {
    if (state.generating) return;
    Sync.publish(Sync.STATES.SHOOTING, {});
    var el = $("#countdown");
    var seq = [3, 2, 1];
    var i = 0;
    el.hidden = false;

    function tick() {
      if (i >= seq.length) {
        el.hidden = true;
        capture();
        return;
      }
      el.textContent = seq[i];
      el.classList.remove("tick");
      void el.offsetWidth; // 重启动画
      el.classList.add("tick");
      i++;
      setTimeout(tick, 960);
    }
    tick();
  }

  function capture() {
    var video = $("#shoot-video");
    if (!video || !video.videoWidth) { onCameraFail(); return; }
    var canvas = document.createElement("canvas");
    var scale = Math.min(1, 1080 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    var ctx = canvas.getContext("2d");
    // 镜像：与预览所见一致
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    var flash = $("#flash");
    flash.classList.remove("on");
    void flash.offsetWidth;
    flash.classList.add("on");

    state.photoDataURL = canvas.toDataURL("image/jpeg", 0.92);
    state.uploadedUrl = null;
    showPreview();
  }

  function showPreview() {
    var img = $("#shoot-preview");
    img.src = state.photoDataURL;
    img.hidden = false;
    $("#shoot-video").style.visibility = "hidden";
    $("#shoot-live-actions").hidden = true;
    $("#shoot-preview-actions").hidden = false;
    var retake = $("#btn-retake");
    retake.disabled = state.retakesLeft <= 0;
    retake.textContent = state.retakesLeft > 0 ? "重拍（剩 " + state.retakesLeft + " 次）" : "重拍次数已用完";
  }

  function backToLive() {
    $("#shoot-preview").hidden = true;
    $("#shoot-video").style.visibility = "visible";
    $("#shoot-live-actions").hidden = false;
    $("#shoot-preview-actions").hidden = true;
    if (!state.cameraOk) {
      $("#shoot-cam-fallback").hidden = false;
    }
  }

  /* ---------- 上传：自拍 → 短时公开图床（图生图接口需要公网 URL） ----------
     三家依次尝试，全部失败才报错；上传成功的地址在重试生成时复用。 */
  function uploadSelfie() {
    if (state.uploadedUrl) return Promise.resolve(state.uploadedUrl);
    var blob = dataURLToBlob(state.photoDataURL);

    function expectUrl(res, name) {
      if (!res.ok) throw new Error(name + " HTTP " + res.status);
      return res.text().then(function (text) {
        var url = text.trim();
        if (!/^https?:\/\//.test(url)) throw new Error(name + " 返回异常");
        return url;
      });
    }

    // 首选 0x0.st（POST 表单，留存期长）
    var tryOx0 = function () {
      var fd = new FormData();
      fd.append("file", blob, "soundprint-selfie.jpg");
      return fetch("https://0x0.st", { method: "POST", body: fd }).then(function (res) {
        return expectUrl(res, "0x0.st");
      });
    };

    // 备选 transfer.sh（PUT）
    var tryTransfer = function () {
      return fetch("https://transfer.sh/soundprint-selfie.jpg", { method: "PUT", body: blob }).then(function (res) {
        return expectUrl(res, "transfer.sh");
      });
    };

    // 兜底 litterbox.catbox.moe（1 小时即焚，正好「用完即弃」）
    var tryLitterbox = function () {
      var fd = new FormData();
      fd.append("reqtype", "fileupload");
      fd.append("time", "1h");
      fd.append("fileToUpload", blob, "soundprint-selfie.jpg");
      return fetch("https://litterbox.catbox.moe/resources/internals/api.php", { method: "POST", body: fd }).then(function (res) {
        return expectUrl(res, "litterbox");
      });
    };

    return tryOx0()
      .catch(function () { return tryTransfer(); })
      .catch(function () { return tryLitterbox(); })
      .then(function (url) {
        state.uploadedUrl = url;
        return url;
      });
  }

  /* ---------- 生成：Pollinations 图生图 ----------
     三级链路，全部真实请求，失败才报错，绝不用预设假图：
     1) kontext 直连 —— 真正保留五官身份的 img2img。
        注意：上游已把 kontext 匿名访问迁到 enter.pollinations.ai（需 Key），
        匿名调用稳定 500，属预期，会自动落到下一级；
     2) 匿名默认模型直连 —— 仍带 image 参数做图生图（保脸度取决于上游），
        匿名层限流明显（402/5xx 随机出现），需要耐心重试；
     3) 默认模型经 images.weserv.nl 图片代理 —— 本地 localhost:端口 演示时
        浏览器 Origin 会被上游 403，代理服务端取图可绕过，且回包带 CORS 头。 */
  function fetchImageOnce(url) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, GENERATE_TIMEOUT);
    return fetch(url, { signal: controller.signal })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) {
          var err = new Error("生图服务 HTTP " + res.status);
          err.status = res.status;
          throw err;
        }
        var type = res.headers.get("content-type") || "";
        if (type.indexOf("image/") !== 0) throw new Error("生图服务返回了非图片内容");
        return res.blob();
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (err.name === "AbortError") throw new Error("生成超时（150 秒），请重试");
        throw err;
      });
  }

  function withRetry(fn, attempts, baseDelay) {
    return fn().catch(function (err) {
      if (attempts <= 1) throw err;
      return new Promise(function (resolve) { setTimeout(resolve, baseDelay); })
        .then(function () { return withRetry(fn, attempts - 1, baseDelay * 2); });
    });
  }

  function generateImage(imageUrl) {
    var prompt = Poster.buildPrompt({
      persona: state.persona,
      style: state.style,
      line: state.line
    });
    var seed = Math.floor(Math.random() * 1000000);
    var path =
      "/prompt/" + encodeURIComponent(prompt) +
      "?image=" + encodeURIComponent(imageUrl) +
      "&width=1024&height=1280&seed=" + seed + "&nologo=true";
    var direct = "https://image.pollinations.ai" + path;
    var proxied = function () {
      // _r 防代理缓存住某一次失败的响应
      return "https://images.weserv.nl/?url=" +
        encodeURIComponent("image.pollinations.ai" + path + "&_r=" + Math.random().toString(36).slice(2));
    };

    return withRetry(function () { return fetchImageOnce(direct + "&model=kontext"); }, 2, 4000)
      .catch(function () { return withRetry(function () { return fetchImageOnce(direct); }, 3, 4000); })
      .catch(function () { return withRetry(function () { return fetchImageOnce(proxied()); }, 3, 5000); })
      .then(function (blob) {
        return new Promise(function (resolve, reject) {
          var objUrl = URL.createObjectURL(blob);
          var img = new Image();
          img.onload = function () { resolve(img); };
          img.onerror = function () {
            URL.revokeObjectURL(objUrl);
            reject(new Error("生成的图片无法解码"));
          };
          img.src = objUrl;
        });
      });
  }

  /* ---------- 生成主流程 ---------- */
  function setPhase(phase) {
    document.querySelectorAll("#draw-steps li").forEach(function (li) {
      var p = li.getAttribute("data-phase");
      li.classList.remove("doing", "done");
      if (p === phase) li.classList.add("doing");
    });
    // 把 phase 之前的步骤标记为 done
    var order = ["upload", "generate", "compose"];
    var idx = order.indexOf(phase);
    document.querySelectorAll("#draw-steps li").forEach(function (li) {
      var p = order.indexOf(li.getAttribute("data-phase"));
      if (p < idx) li.classList.add("done");
    });
  }

  function finishPhase() {
    document.querySelectorAll("#draw-steps li").forEach(function (li) {
      li.classList.remove("doing");
      li.classList.add("done");
    });
  }

  function resetPhases() {
    document.querySelectorAll("#draw-steps li").forEach(function (li) {
      li.classList.remove("doing", "done");
    });
  }

  function showDrawError(message) {
    state.generating = false;
    $("#draw-error-text").textContent = message;
    $("#draw-error").hidden = false;
    document.querySelectorAll("#draw-steps li.doing").forEach(function (li) {
      li.classList.remove("doing");
    });
    // 失败释放工位：大屏回吸引态，不把报错当内容
    Sync.publish(Sync.STATES.IDLE, { reason: "generation-failed" });
  }

  function runGeneration() {
    if (state.generating) return;
    state.generating = true;
    $("#draw-error").hidden = true;
    $("#drawing-nickname").textContent = state.nickname;
    resetPhases();
    showScreen("scr-drawing");
    Sync.publish(Sync.STATES.DRAWING, { nickname: state.nickname });

    setPhase("upload");
    uploadSelfie()
      .catch(function () {
        throw new Error("自拍上传失败（图床不可达或被网络拦截），请检查网络后重试");
      })
      .then(function (url) {
        setPhase("generate");
        return generateImage(url);
      })
      .then(function (img) {
        setPhase("compose");
        return document.fonts.ready.then(function () { return img; });
      })
      .then(function (img) {
        state.serial = Poster.randomSerial();
        var title = Poster.titleFor(state.persona, state.style);
        // 分享页地址：相对当前页面解析，换任意静态托管路径都成立
        state.shareUrl = new URL(
          "share.html?id=" + encodeURIComponent(state.serial),
          location.href
        ).href;
        state.posterCanvas = Poster.composePoster({
          image: img,
          persona: state.persona,
          style: state.style,
          title: title,
          nickname: state.nickname,
          line: state.line,
          serial: state.serial,
          shareUrl: state.shareUrl
        });
        // 下载用 PNG；同步给大屏用 JPEG（控制 localStorage 体积）
        state.posterDataURL = state.posterCanvas.toDataURL("image/png");
        state.generating = false;
        finishPhase();
        showResult(title);
      })
      .catch(function (err) {
        // 明确报错 + 可重试，绝不用预设假图冒充成功
        showDrawError(err && err.message ? err.message : "未知错误，请重试");
      });
  }

  /* ---------- 结果 ---------- */
  function showResult(title) {
    var p = Poster.persona(state.persona);
    var s = Poster.style(state.style);
    $("#result-img").src = state.posterDataURL;
    $("#result-title").textContent = title;
    $("#result-meta").innerHTML =
      "<b>@" + escapeHtml(state.nickname) + "</b> · " +
      p.cn + " × " + s.cn + " · SOUNDPRINT " + p.sku + "款 · 编号 <b>" + state.serial + "</b>";
    showScreen("scr-result");
    var wallDataURL = state.posterCanvas.toDataURL("image/jpeg", 0.85);
    Sync.publish(Sync.STATES.REVEAL, {
      dataURL: wallDataURL,
      title: title,
      nickname: state.nickname,
      line: state.line,
      serial: state.serial,
      persona: state.persona,
      style: state.style
    });
    // 入库（Step 3）：大屏九宫格与分享页都从存档读；降采样在 store 内完成
    if (window.SoundprintStore) {
      window.SoundprintStore.saveFromDataURL(wallDataURL, {
        title: title,
        nickname: state.nickname,
        line: state.line,
        serial: state.serial,
        persona: state.persona,
        style: state.style
      });
    }
  }

  function escapeHtml(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function downloadPoster() {
    if (!state.posterDataURL) return;
    var a = document.createElement("a");
    a.href = state.posterDataURL;
    a.download = "soundprint-" + (state.serial || "poster") + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------- 重置 ---------- */
  function resetToIdle() {
    state.photoDataURL = null;
    state.retakesLeft = RETAKES_MAX;
    state.persona = null;
    state.style = null;
    state.nickname = "";
    state.line = "";
    state.serial = null;
    state.shareUrl = null;
    state.uploadedUrl = null;
    state.posterCanvas = null;
    state.posterDataURL = null;
    state.generating = false;

    $("#input-nickname").value = "";
    $("#input-line").value = "";
    updateCounters();
    $("#safety-hint").hidden = true;
    $("#draw-error").hidden = true;
    backToLive();
    showScreen("scr-idle");
    Sync.publish(Sync.STATES.IDLE, {});
  }

  /* ---------- 输入与安全 ---------- */
  function updateCounters() {
    $("#count-nickname").textContent = $("#input-nickname").value.length + " / 12";
    $("#count-line").textContent = $("#input-line").value.length + " / 24";
  }

  function validateAndGenerate() {
    var nickname = $("#input-nickname").value.trim();
    var line = $("#input-line").value.trim();
    var hint = $("#safety-hint");

    if (!nickname) {
      hint.textContent = "先填个昵称 —— 大屏要喊你的名字。";
      hint.hidden = false;
      $("#input-nickname").focus();
      return;
    }
    var cn = Safety.check(nickname);
    if (!cn.ok) {
      hint.textContent = "昵称没过审：" + cn.reason;
      hint.hidden = false;
      $("#input-nickname").focus();
      return;
    }
    if (line) {
      var cl = Safety.check(line);
      if (!cl.ok) {
        hint.textContent = "这句话没过审：" + cl.reason;
        hint.hidden = false;
        $("#input-line").focus();
        return;
      }
    }
    hint.hidden = true;
    state.nickname = nickname;
    state.line = line;
    runGeneration();
  }

  /* ---------- 事件绑定 ---------- */
  function bind() {
    $("#btn-start").addEventListener("click", function () {
      backToLive();
      showScreen("scr-shoot");
      Sync.publish(Sync.STATES.SHOOTING, {}); // 开始即锁工位
    });

    $("#btn-shutter").addEventListener("click", startCountdown);

    $("#btn-retake").addEventListener("click", function () {
      if (state.retakesLeft <= 0) return;
      state.retakesLeft--;
      state.photoDataURL = null;
      backToLive();
    });

    $("#btn-use-photo").addEventListener("click", function () {
      showScreen("scr-persona");
    });

    $("#btn-cam-retry").addEventListener("click", function () {
      $("#shoot-cam-fallback").hidden = true;
      initCamera();
      if (state.cameraOk) $("#btn-shutter").disabled = false;
    });

    $("#file-input").addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        state.photoDataURL = reader.result;
        state.uploadedUrl = null;
        showPreview();
      };
      reader.readAsDataURL(file);
      ev.target.value = "";
    });

    $("#persona-grid").addEventListener("click", function (ev) {
      var card = ev.target.closest("[data-persona]");
      if (!card) return;
      state.persona = card.getAttribute("data-persona");
      showScreen("scr-style");
    });

    $("#style-grid").addEventListener("click", function (ev) {
      var card = ev.target.closest("[data-style]");
      if (!card) return;
      state.style = card.getAttribute("data-style");
      var p = Poster.persona(state.persona);
      var s = Poster.style(state.style);
      $("#line-summary").innerHTML =
        "已选：<b>" + p.cn + " " + p.enLabel + "</b> × <b>" + s.cn + "</b>，称号将是「" +
        Poster.titleFor(state.persona, state.style) + "」";
      showScreen("scr-line");
      setTimeout(function () { $("#input-nickname").focus(); }, 350);
    });

    document.querySelectorAll("[data-back]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showScreen(btn.getAttribute("data-back"));
      });
    });

    ["#input-nickname", "#input-line"].forEach(function (sel) {
      $(sel).addEventListener("input", function () {
        updateCounters();
        $("#safety-hint").hidden = true;
      });
      $(sel).addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") validateAndGenerate();
      });
    });

    $("#btn-generate").addEventListener("click", validateAndGenerate);
    $("#btn-draw-retry").addEventListener("click", runGeneration);
    $("#btn-draw-back").addEventListener("click", function () {
      $("#draw-error").hidden = true;
      showScreen("scr-line");
    });
    $("#btn-download").addEventListener("click", downloadPoster);
    $("#btn-again").addEventListener("click", resetToIdle);
    $("#btn-home").addEventListener("click", function () {
      if (state.generating) return; // 生成中不允许中断（fetch 不可随意取消，避免半张图）
      resetToIdle();
    });
  }

  /* ---------- 启动 ---------- */
  bind();
  initCamera();
  updateCounters();
  Sync.publish(Sync.STATES.IDLE, {}); // 页面加载即广播空闲，避免大屏假死占用

  // 工位页关闭 / 刷新时释放工位
  window.addEventListener("beforeunload", function () {
    Sync.publish(Sync.STATES.IDLE, { reason: "kiosk-closed" });
    stopCamera();
  });
})();
