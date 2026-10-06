/* ============================================================
   声纹 SOUNDPRINT · 展示大屏主逻辑（Step 3）
   只消费 SoundprintSync 状态，不发布任何指令：
   idle     吸引态：品牌 + 九宫格轮播
   shooting 正在拍摄…（工位占用指示）
   drawing  正在绘制 {nickname} 的声纹（波形动画）
   reveal   全屏揭晓约 5 秒 → 飞入九宫格 → 回吸引态
   消息中断超过阈值自动回吸引态，避免假死占用。
   ============================================================ */
(function () {
  "use strict";

  var Sync = window.SoundprintSync;
  var Store = window.SoundprintStore;

  var REVEAL_MS = 5200;  // 全屏揭晓停留时长
  var FLIGHT_MS = 900;   // 揭晓 → 九宫格 飞行动画
  var CYCLE_MS = 6500;   // 吸引态轮播间隔
  // 各状态的消息保鲜期：超过视为工位掉线，回吸引态
  var STALE = { shooting: 150000, drawing: 210000, reveal: 30000 };

  var CHIP_TEXT = { idle: "空闲", shooting: "拍摄中", drawing: "生成中", reveal: "揭晓中" };

  var current = "idle";
  var revealTimer = null;
  var watchdog = null;
  var cycleTimer = null;

  function $(sel) { return document.querySelector(sel); }

  /* ---------- 状态 chip ---------- */
  function setChip(st) {
    $("#chip").dataset.state = st;
    $("#chip-text").textContent = CHIP_TEXT[st] || st;
  }

  /* ---------- 层切换：idle 层常驻做背景，覆盖层按需叠加 ---------- */
  function showOverlay(name) {
    $("#layer-idle").classList.add("on");
    ["shooting", "drawing", "reveal"].forEach(function (n) {
      document.getElementById("layer-" + n).classList.toggle("on", n === name);
    });
  }

  /* ---------- 九宫格 ---------- */
  function placeholderHTML(i) {
    return (
      '<div class="ph">' +
        '<span class="eq"><i></i><i></i><i></i><i></i><i></i></span>' +
        '<span class="txt">虚位以待</span>' +
        '<span class="no">SLOT 0' + (i + 1) + "</span>" +
      "</div>"
    );
  }

  /**
   * 重绘九宫格（最新在第一格）。
   * @param {object} [extra] 存档写入失败时的临时记录，保证刚揭晓的海报仍能上墙
   */
  function renderGrid(extra) {
    var posters = Store.list();
    if (extra && extra.id && !posters.some(function (p) { return p.id === extra.id; })) {
      posters.unshift(extra);
    }
    posters = posters.slice(0, Store.CAP);

    var grid = $("#wall-grid");
    grid.innerHTML = "";
    for (var i = 0; i < Store.CAP; i++) {
      var cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.idx = String(i);
      var p = posters[i];
      if (p) {
        cell.classList.add("filled");
        cell.dataset.pid = p.id;
        var img = document.createElement("img");
        img.src = p.thumb || p.dataURL;
        img.alt = (p.title || "声纹海报") + " · @" + (p.nickname || "匿名");
        cell.appendChild(img);
      } else {
        cell.innerHTML = placeholderHTML(i);
      }
      grid.appendChild(cell);
    }

    $("#idle-count").hidden = posters.length === 0;
    $("#idle-count-n").textContent = String(posters.length);
  }

  /* ---------- 吸引态轮播：随机两格交叉换位 / 单格脉冲高亮 ---------- */
  function cycleOnce() {
    var filled = Array.prototype.slice.call(document.querySelectorAll("#wall-grid .cell.filled"));
    if (filled.length >= 2) {
      var ai = Math.floor(Math.random() * filled.length);
      var bi;
      do { bi = Math.floor(Math.random() * filled.length); } while (bi === ai);
      var a = filled[ai];
      var b = filled[bi];
      a.classList.add("swap");
      b.classList.add("swap");
      setTimeout(function () {
        var imgA = a.querySelector("img");
        var imgB = b.querySelector("img");
        var tSrc = imgA.src, tAlt = imgA.alt;
        imgA.src = imgB.src; imgA.alt = imgB.alt;
        imgB.src = tSrc; imgB.alt = tAlt;
        var tPid = a.dataset.pid; a.dataset.pid = b.dataset.pid; b.dataset.pid = tPid;
        a.classList.remove("swap");
        b.classList.remove("swap");
      }, 320);
    } else if (filled.length === 1) {
      var c = filled[0];
      c.classList.add("pulse");
      setTimeout(function () { c.classList.remove("pulse"); }, 1300);
    }
  }

  function startCycle() {
    stopCycle();
    cycleTimer = setInterval(cycleOnce, CYCLE_MS);
  }

  function stopCycle() {
    if (cycleTimer) clearInterval(cycleTimer);
    cycleTimer = null;
  }

  /* ---------- 看门狗：消息中断超时回吸引态 ---------- */
  function armWatchdog(st) {
    if (watchdog) clearTimeout(watchdog);
    watchdog = null;
    var ms = STALE[st];
    if (!ms || st === "reveal") return; // reveal 自带计时器
    watchdog = setTimeout(function () { toIdle(); }, ms);
  }

  /* ---------- 状态进入 ---------- */
  function toIdle() {
    current = "idle";
    setChip("idle");
    if (revealTimer) clearTimeout(revealTimer);
    revealTimer = null;
    showOverlay(null);
    startCycle();
  }

  function toShooting() {
    current = "shooting";
    setChip("shooting");
    stopCycle();
    if (revealTimer) clearTimeout(revealTimer);
    revealTimer = null;
    showOverlay("shooting");
    armWatchdog("shooting");
  }

  function toDrawing(nickname) {
    current = "drawing";
    setChip("drawing");
    stopCycle();
    if (revealTimer) clearTimeout(revealTimer);
    revealTimer = null;
    $("#drawing-nickname").textContent = nickname || "TA";
    showOverlay("drawing");
    armWatchdog("drawing");
  }

  function toReveal(payload) {
    if (!payload || !payload.dataURL) { toIdle(); return; }
    armWatchdog("idle"); // 清掉拍摄/生成看门狗，揭晓用自己的计时
    current = "reveal";
    setChip("reveal");
    stopCycle();

    $("#reveal-img").src = payload.dataURL;
    $("#reveal-title").textContent = payload.title || "声纹海报";
    $("#reveal-nickname").textContent = "@" + (payload.nickname || "匿名");
    $("#reveal-serial").textContent = payload.serial || "----";
    showOverlay("reveal");

    // 入库（与工位侧互为冗余，按编号去重）；失败不阻塞揭晓
    var saved = Store.saveFromDataURL(payload.dataURL, payload);

    if (revealTimer) clearTimeout(revealTimer);
    revealTimer = setTimeout(function () {
      Promise.resolve(saved).then(function (rec) {
        flyToGrid(payload, rec);
      });
    }, REVEAL_MS);
  }

  /* ---------- 揭晓 → 飞入九宫格 → 回吸引态 ---------- */
  function flyToGrid(payload, savedRec) {
    var frame = $("#reveal-frame");
    var from = frame.getBoundingClientRect();

    // 先把新海报渲染进墙（最新在第一格），幽灵图落在它上面，落地无跳变
    var fallback = savedRec ? null : {
      id: payload.serial || ("tmp-" + Date.now()),
      dataURL: payload.dataURL,
      thumb: payload.dataURL,
      title: payload.title || "",
      nickname: payload.nickname || ""
    };
    renderGrid(fallback);
    var target = document.querySelector('#wall-grid .cell[data-idx="0"]');

    // 揭晓层淡出，露出身后的墙
    document.getElementById("layer-reveal").classList.remove("on");

    function endReveal() {
      if (current !== "reveal") return;
      current = "idle";
      setChip("idle");
      startCycle();
    }

    if (!target || !from.width) { endReveal(); return; }
    var to = target.getBoundingClientRect();
    target.classList.add("arrived");

    var ghost = document.createElement("img");
    ghost.src = payload.dataURL;
    ghost.alt = "";
    ghost.className = "fly-ghost";
    ghost.style.left = from.left + "px";
    ghost.style.top = from.top + "px";
    ghost.style.width = from.width + "px";
    ghost.style.height = from.height + "px";
    ghost.style.transformOrigin = "0 0";
    document.body.appendChild(ghost);

    var dx = to.left - from.left;
    var dy = to.top - from.top;
    var sx = to.width / from.width;
    var sy = to.height / from.height;

    var anim = ghost.animate(
      [
        { transform: "translate(0px, 0px) scale(1, 1)", opacity: 1 },
        { transform: "translate(" + dx + "px, " + dy + "px) scale(" + sx + ", " + sy + ")", opacity: 0.98 }
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.22, 0.9, 0.24, 1)", fill: "forwards" }
    );
    anim.onfinish = function () {
      ghost.remove();
      endReveal();
    };
    // 动画被打断的兜底
    setTimeout(function () {
      if (ghost.parentNode) { ghost.remove(); endReveal(); }
    }, FLIGHT_MS + 800);
  }

  /* ---------- 消息入口 ---------- */
  function applyMsg(msg) {
    if (!msg || !msg.state) return;
    switch (msg.state) {
      case Sync.STATES.IDLE:
        armWatchdog("idle");
        if (current !== "idle") toIdle();
        break;
      case Sync.STATES.SHOOTING:
        toShooting();
        break;
      case Sync.STATES.DRAWING:
        toDrawing(msg.payload && msg.payload.nickname);
        break;
      case Sync.STATES.REVEAL:
        toReveal(msg.payload || {});
        break;
    }
  }

  /* ---------- 启动 ---------- */
  renderGrid();
  toIdle();
  Sync.subscribe(applyMsg);

  // 打开大屏时恢复现场：消息新鲜则补播对应状态，否则保持吸引态
  var last = Sync.getLast();
  if (last && last.state && last.state !== Sync.STATES.IDLE) {
    var age = Date.now() - (last.ts || 0);
    var limit = STALE[last.state];
    if (limit && age < limit) applyMsg(last);
  }

  // 工位写入存档（如大屏错过 reveal 消息）时，吸引态下就地刷新九宫格
  window.addEventListener("storage", function (ev) {
    if (ev.key === Store.KEY && current === "idle") renderGrid();
  });
})();
