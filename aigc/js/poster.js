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
     品牌沙盒提示词模板（安全四层之 L3 · 生成约束，定稿 v2）
     ------------------------------------------------------------
     固定骨架：
       keep the same face and identity, festival concert poster,
       {style.prompt}, {persona.en} music atmosphere,
       wearing SOUNDPRINT {persona.skuEn} headphones,
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
      "keep the same face and identity, festival concert poster, " +
      s.prompt + ", " + p.en + " music atmosphere, wearing SOUNDPRINT " +
      p.skuEn + " headphones, " + mood + ", " + NEGATIVE
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

    // 底：AI 成片
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    drawCover(ctx, opts.image, W, H);

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
