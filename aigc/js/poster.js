/* ============================================================
   声纹 SOUNDPRINT · 海报合成（Canvas 1024×1280 竖版）
   - 人格 / 风格 / SKU / 提示词 映射表
   - 人格 × 风格 4×4 称号表
   - composePoster：成片打底 + 品牌锁相叠字
   - drawQR：真二维码（vendor/qrcode.js，Step 3 接入，签名不变）
   ============================================================ */
window.SoundprintPoster = (function () {
  "use strict";

  var W = 1024;
  var H = 1280;

  var PERSONAS = {
    pop:        { cn: "流行", en: "pop",        enLabel: "POP",        sku: "暖金单元", skuEn: "warm-gold" },
    electronic: { cn: "电子", en: "electronic", enLabel: "ELECTRONIC", sku: "霓虹低频", skuEn: "neon-bass" },
    rock:       { cn: "摇滚", en: "rock",       enLabel: "ROCK",       sku: "现场失真", skuEn: "live-distortion" },
    folk:       { cn: "民谣", en: "folk",       enLabel: "FOLK",       sku: "人声突出", skuEn: "vocal-forward" }
  };

  var STYLES = {
    film: { cn: "胶片噪点", enLabel: "FILM GRAIN",   prompt: "film grain analog photo" },
    neon: { cn: "赛博霓虹", enLabel: "CYBER NEON",   prompt: "cyberpunk neon" },
    acid: { cn: "酸性海报", enLabel: "ACID POSTER",  prompt: "acid graphics poster" },
    ink:  { cn: "水墨梦核", enLabel: "INK DREAMCORE", prompt: "ink wash dreamcore" }
  };

  // 称号表：TITLES[persona][style]
  var TITLES = {
    pop:        { film: "暖金胶片", neon: "霓虹甜心", acid: "酸性泡泡", ink: "梦核暖调" },
    electronic: { film: "低频胶片", neon: "霓虹脉冲", acid: "酸性电流", ink: "梦核低频" },
    rock:       { film: "失真胶片", neon: "霓虹嘶吼", acid: "酸性现场", ink: "墨浪失真" },
    folk:       { film: "胶片人声", neon: "霓虹诗行", acid: "酸性麦田", ink: "水墨人声" }
  };

  function persona(key) { return PERSONAS[key] || PERSONAS.pop; }
  function style(key) { return STYLES[key] || STYLES.film; }

  function titleFor(personaKey, styleKey) {
    var row = TITLES[personaKey] || TITLES.pop;
    return row[styleKey] || row.film;
  }

  function randomSerial() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 去掉易混淆的 I/O/0/1
    var s = "";
    for (var i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return "SP-" + s;
  }

  /* ============================================================
     品牌沙盒提示词模板（安全四层之 L3 · 生成约束，定稿 v3）
     ------------------------------------------------------------
     固定骨架（编辑指令式：明确告诉图生图模型这是「改这张图」，
     不是「画个新场景」——匿名层只剩纯文生图模型时会退化为氛围场景，
     但 kontext 等图生图模型可用时，这版提示词的身份保留显著更强）：
       edit this exact photo of the person, keep their face, pose,
       clothing and identity unchanged, transform only the style,
       background and lighting into a {style.prompt} {persona.en}
       music festival poster, they are wearing SOUNDPRINT
       {persona.skuEn} headphones,
       mood from "{line}" | euphoric festival mood
     负面约束（追加在末尾，挡输出越界）：
       no nudity, no suggestive content,        —— 色情
       no violence, no blood, no weapons,       —— 暴恐
       no politician, no political symbols,     —— 涉政
       no competitor logos, no brand marks,     —— 竞品（品牌后叠，不让模型画）
       no extra text, no captions, no watermark —— 文字乱入（文案全部由 Canvas 叠）
     说明：
     - 用户输入已过 L2 敏感词/正则才进提示词，且只作为画面情绪引用；
     - 用户句子截断到 60 字符并去掉引号换行，降低注入面；
     - 品牌元素（Logo / 称号 / 编号 / 二维码）一律 Canvas 后叠，
       模型自由发挥也不动品牌锁相。
     ============================================================ */
  var NEGATIVE =
    "no nudity, no suggestive content, no violence, no blood, no weapons, " +
    "no politician, no political symbols, no competitor logos, no brand marks, " +
    "no extra text, no captions, no watermark";

  function buildPrompt(opts) {
    var p = persona(opts.persona);
    var s = style(opts.style);
    var line = (opts.line || "").replace(/["\n\r]/g, " ").slice(0, 60);
    var mood = line ? 'mood from "' + line + '"' : "euphoric festival mood";
    return (
      "edit this exact photo of the person, keep their face, pose, clothing " +
      "and identity unchanged, transform only the style, background and " +
      "lighting into a " + s.prompt + " " + p.en + " music festival poster, " +
      "they are wearing SOUNDPRINT " + p.skuEn + " headphones, " +
      mood + ", " + NEGATIVE
    );
  }

  /** cover 方式把图铺满面布 */
  function drawCover(ctx, img, w, h) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var scale = Math.max(w / iw, h / ih);
    var dw = iw * scale;
    var dh = ih * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  /* ============================================================
     照片驱动合成（composePoster 传入 opts.photo 时启用）
     ------------------------------------------------------------
     上游现状（2026-10 实测）：Pollinations 匿名层只剩 sana
     （DreamShaper 8 LCM，纯文生图，无视 image 参数）；kontext 等
     全部图生图模型已迁到 enter.pollinations.ai，匿名 401/500。
     因此当 AI 成片里并不包含用户本人时，绝不把它冒充「图生图」——
     改为把自拍本体合成进海报：
       1) 照片 cover 铺满打底（身份 100% 保真：就是本人照片）
       2) 按所选风格做像素级调色（胶片 / 霓虹 / 酸性 / 水墨）
       3) AI 场景以 screen 混合叠入：亮部（灯光 / 激光 / 霓虹）
          浮到照片上，暗部自然消失 —— AI 负责音乐节氛围
       4) 颗粒统一两层质感
     ============================================================ */

  /* 像素级风格调色：只动照片层，让自拍贴合所选画面气质 */
  function applyStyleGrade(ctx, styleKey, w, h) {
    var id = ctx.getImageData(0, 0, w, h);
    var d = id.data;
    var i, r, g, b, lum;
    if (styleKey === "film") {
      // 胶片：抬黑场、暖高光、轻微降饱和
      for (i = 0; i < d.length; i += 4) {
        r = d[i]; g = d[i + 1]; b = d[i + 2];
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        d[i]     = Math.min(255, r * 0.90 + lum * 0.06 + 22);
        d[i + 1] = Math.min(255, g * 0.88 + lum * 0.06 + 15);
        d[i + 2] = Math.min(255, b * 0.86 + lum * 0.06 + 8);
      }
    } else if (styleKey === "neon") {
      // 赛博霓虹：压绿、抬蓝品红，暗部偏冷
      for (i = 0; i < d.length; i += 4) {
        r = d[i]; g = d[i + 1]; b = d[i + 2];
        d[i]     = Math.min(255, r * 0.98 + 14);
        d[i + 1] = g * 0.86;
        d[i + 2] = Math.min(255, b * 1.10 + 20);
      }
    } else if (styleKey === "acid") {
      // 酸性海报：5 档色调分离 + 饱和度拉高
      for (i = 0; i < d.length; i += 4) {
        r = d[i]; g = d[i + 1]; b = d[i + 2];
        r = Math.round(r / 255 * 4) / 4 * 255;
        g = Math.round(g / 255 * 4) / 4 * 255;
        b = Math.round(b / 255 * 4) / 4 * 255;
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        d[i]     = Math.max(0, Math.min(255, lum + (r - lum) * 1.55));
        d[i + 1] = Math.max(0, Math.min(255, lum + (g - lum) * 1.55));
        d[i + 2] = Math.max(0, Math.min(255, lum + (b - lum) * 1.55));
      }
    } else {
      // 水墨梦核：去色 72%、软对比、微冷宣纸底
      for (i = 0; i < d.length; i += 4) {
        r = d[i]; g = d[i + 1]; b = d[i + 2];
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        lum = lum + (lum - 128) * 0.18; // 软 S 曲线
        d[i]     = Math.max(0, Math.min(255, r * 0.28 + lum * 0.72));
        d[i + 1] = Math.max(0, Math.min(255, g * 0.28 + lum * 0.72));
        d[i + 2] = Math.max(0, Math.min(255, b * 0.28 + lum * 0.72 + 6));
      }
    }
    ctx.putImageData(id, 0, 0);
  }

  /* 胶片颗粒：128×128 中性灰噪点 tile，overlay 低透明度平铺 */
  var grainTile = null;
  function addGrain(ctx, w, h, alpha) {
    if (!grainTile) {
      grainTile = document.createElement("canvas");
      grainTile.width = grainTile.height = 128;
      var tc = grainTile.getContext("2d");
      var id = tc.createImageData(128, 128);
      for (var i = 0; i < id.data.length; i += 4) {
        var v = 108 + Math.floor(Math.random() * 40); // 中性灰附近抖动
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = 255;
      }
      tc.putImageData(id, 0, 0);
    }
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ctx.createPattern(grainTile, "repeat");
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /* AI 氛围层叠入强度：霓虹场景暗部多亮部少，screen 最出效果 */
  var GRADE = {
    film: { scene: 0.40, grain: 0.22, dim: 0.16 },
    neon: { scene: 0.55, grain: 0.14, dim: 0.20 },
    acid: { scene: 0.42, grain: 0.16, dim: 0.12 },
    ink:  { scene: 0.32, grain: 0.18, dim: 0.10 }
  };

  /**
   * 照片驱动合成：自拍打底 + 风格调色 + AI 场景 screen 叠入 + 颗粒。
   * @param {CanvasRenderingContext2D} ctx 已铺黑底的目标画布
   * @param {HTMLImageElement} photo 用户自拍（已加载）
   * @param {HTMLImageElement} scene AI 生成的音乐节场景
   * @param {string} styleKey 风格 key
   */
  function composeDrivenByPhoto(ctx, photo, scene, styleKey) {
    var g = GRADE[styleKey] || GRADE.film;
    drawCover(ctx, photo, W, H);
    applyStyleGrade(ctx, styleKey, W, H);
    // 轻微压暗照片层，让 screen 叠入的灯光读得出来
    ctx.fillStyle = "rgba(10,10,10," + g.dim + ")";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = g.scene;
    drawCover(ctx, scene, W, H);
    ctx.restore();
    addGrain(ctx, W, H, g.grain);
  }

  /* 覆盖层语言：纯黑 / 白 / 灰，发丝线，等宽编号 —— 不用彩色渐变 */
  var INK = "#f2f2f2";
  var DIM = "rgba(160,160,160,0.95)";
  var MONO = '"IBM Plex Mono", "Space Grotesk", monospace';

  /**
   * 真二维码（Step 3）：用 vendor/qrcode.js（Kazuhiko Arase, MIT）绘制。
   * 方形白底 + 深色模块，保证深色海报上可扫。
   * @param {HTMLCanvasElement} canvas
   * @param {string} url  分享页地址（location.origin 拼 share.html?id=编号）
   */
  function drawQR(canvas, url, x, y, size) {
    var ctx = canvas.getContext("2d");
    var s = size || 150;
    var qx = (x == null) ? canvas.width - s - 56 : x;
    var qy = (y == null) ? canvas.height - s - 56 : y;

    ctx.save();
    ctx.fillStyle = "rgba(242,242,242,0.97)";
    ctx.fillRect(qx, qy, s, s);

    var qr = null;
    if (url && typeof window.qrcode === "function") {
      try {
        qr = window.qrcode(0, "M"); // typeNumber 0 = 自动选最小版本
        qr.addData(url);
        qr.make();
      } catch (e) { qr = null; }
    }

    if (qr) {
      var count = qr.getModuleCount();
      var pad = Math.round(s * 0.1); // 静区
      var cell = (s - pad * 2) / count;
      ctx.fillStyle = "#0a0a0a";
      for (var r = 0; r < count; r++) {
        for (var c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(
              qx + pad + Math.floor(c * cell),
              qy + pad + Math.floor(r * cell),
              Math.ceil(cell),
              Math.ceil(cell)
            );
          }
        }
      }
    } else {
      // 库未加载或无 URL：留空底 + 提示，不画假码（扫不出比没有更糟）
      ctx.strokeStyle = "rgba(10,10,10,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(qx + 8, qy + 8, s - 16, s - 16);
      ctx.font = "600 " + Math.round(s * 0.09) + 'px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(10,10,10,0.55)";
      ctx.fillText("码未生成", qx + s / 2, qy + s / 2);
    }
    ctx.restore();
  }

  /**
   * 合成最终海报。
   * @param {object} opts
   *   image    {HTMLImageElement} AI 成片（已加载）
   *   photo    {HTMLImageElement} 可选：用户自拍（已加载）。传入即启用
   *            照片驱动合成 —— 用于 AI 成片不含本人时（匿名文生图层），
   *            让海报真正由照片驱动；图生图可用时不传，AI 成片即含本人
   *   persona  {string} 人格 key
   *   style    {string} 风格 key
   *   title    {string} 称号
   *   nickname {string}
   *   line     {string}
   *   serial   {string} SP-XXXX
   *   shareUrl {string} 分享页地址（二维码内容，可空）
   * @returns {HTMLCanvasElement} 1024×1280
   */
  function composePoster(opts) {
    var p = persona(opts.persona);
    var s = style(opts.style);
    var canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext("2d");

    // 底：AI 成片；传入自拍时改为照片驱动合成（见 composeDrivenByPhoto 注释）
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    if (opts.photo) {
      composeDrivenByPhoto(ctx, opts.photo, opts.image, opts.style);
    } else {
      drawCover(ctx, opts.image, W, H);
    }

    // 顶部压暗（品牌区，功能性可读性压暗）
    var top = ctx.createLinearGradient(0, 0, 0, 260);
    top.addColorStop(0, "rgba(10,10,10,0.88)");
    top.addColorStop(1, "rgba(10,10,10,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 260);

    // 底部压暗（文案区）
    var bottom = ctx.createLinearGradient(0, H - 560, 0, H);
    bottom.addColorStop(0, "rgba(10,10,10,0)");
    bottom.addColorStop(0.45, "rgba(10,10,10,0.84)");
    bottom.addColorStop(1, "rgba(10,10,10,0.95)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, H - 560, W, 560);

    // 发丝边框
    ctx.strokeStyle = "rgba(242,242,242,0.28)";
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, W - 44, H - 44);

    // ---- 顶部品牌行 ----
    // EQ 标志（实白方条）
    var eqX = 56, eqY = 62;
    var bars = [0.45, 0.9, 0.65, 1, 0.55];
    ctx.fillStyle = INK;
    for (var i = 0; i < bars.length; i++) {
      var bh = 30 * bars[i];
      ctx.fillRect(eqX + i * 10, eqY + 30 - bh, 5, bh);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = '900 34px "Noto Sans SC", sans-serif';
    ctx.fillText("声纹", eqX + 64, eqY + 28);
    var cnW = ctx.measureText("声纹").width;
    ctx.font = '700 21px "Space Grotesk", sans-serif';
    ctx.fillText("SOUNDPRINT", eqX + 64 + cnW + 12, eqY + 27);

    // 右上：等宽编号 + 活动
    ctx.textAlign = "right";
    ctx.fillStyle = INK;
    ctx.font = "500 24px " + MONO;
    ctx.fillText(opts.serial, W - 56, eqY + 16);
    ctx.fillStyle = DIM;
    ctx.font = '500 17px "Noto Sans SC", sans-serif';
    ctx.fillText("音乐节 AIGC 海报工位", W - 56, eqY + 46);

    // ---- 底部文案 ----
    var lx = 64; // 左边界
    var y = H - 300;

    // 结构发丝线：文案区与画面分界
    ctx.strokeStyle = "rgba(242,242,242,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, y - 38);
    ctx.lineTo(W - 56, y - 38);
    ctx.stroke();

    // 人格 × 风格 小标（白，字距）
    ctx.textAlign = "left";
    ctx.font = '600 20px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.fillStyle = INK;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
    ctx.fillText(
      (p.cn + " " + p.enLabel + " × " + s.cn + " " + s.enLabel).toUpperCase(),
      lx, y
    );
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

    // 称号（纯白大字）
    ctx.font = '900 104px "Noto Sans SC", sans-serif';
    ctx.fillStyle = INK;
    ctx.fillText(opts.title, lx, y + 108);

    // 用户那句话
    var lineY = y + 168;
    if (opts.line) {
      ctx.font = '500 30px "Noto Sans SC", sans-serif';
      ctx.fillStyle = "rgba(242,242,242,0.94)";
      ctx.fillText("“" + opts.line + "”", lx, lineY);
      lineY += 46;
    }

    // 昵称
    ctx.font = '700 26px "Noto Sans SC", sans-serif';
    ctx.fillStyle = INK;
    ctx.fillText("@" + opts.nickname, lx, lineY + 6);

    // SKU + 话题
    ctx.font = '500 19px "Noto Sans SC", sans-serif';
    ctx.fillStyle = DIM;
    ctx.fillText("SOUNDPRINT " + p.sku + "款 · #我的声纹", lx, lineY + 44);

    // 真二维码（右下）：扫码打开分享页保存海报
    drawQR(canvas, opts.shareUrl || "", null, null, 150);
    ctx.font = "500 15px " + MONO;
    ctx.textAlign = "center";
    ctx.fillStyle = DIM;
    ctx.fillText("扫码带走", W - 56 - 75, H - 40);

    ctx.restore && ctx.restore();
    return canvas;
  }

  return {
    W: W,
    H: H,
    PERSONAS: PERSONAS,
    STYLES: STYLES,
    TITLES: TITLES,
    persona: persona,
    style: style,
    titleFor: titleFor,
    randomSerial: randomSerial,
    buildPrompt: buildPrompt,
    NEGATIVE: NEGATIVE,
    composePoster: composePoster,
    drawQR: drawQR
  };
})();
