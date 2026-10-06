/* ============================================================
   声纹 SOUNDPRINT · 输入内容安全校验（安全四层之 L2）
   先审后生成：命中即停在输入页，不请求模型，也不静默打码后发出去。
   原型内置少量演示拦截词，方便评审现场点一遍；真机词库由运营维护。
   ============================================================ */
window.SoundprintSafety = (function () {
  "use strict";

  var MAX_LEN = 24; // 昵称 / 一句话 的硬上限（昵称在页面层再收紧到 12）

  // 演示拦截词（刻意保持少量、分类清晰；真机接入完整词库）
  var BLOCKLIST = [
    // 涉政 / 暴恐
    { word: "恐怖", cat: "涉政暴恐" },
    { word: "炸弹", cat: "涉政暴恐" },
    { word: "枪支", cat: "涉政暴恐" },
    { word: "法轮", cat: "涉政暴恐" },
    // 色情
    { word: "色情", cat: "色情" },
    { word: "裸聊", cat: "色情" },
    { word: "约炮", cat: "色情" },
    // 辱骂 / 歧视
    { word: "傻逼", cat: "辱骂歧视" },
    { word: "废物", cat: "辱骂歧视" },
    { word: "去死", cat: "辱骂歧视" },
    // 赌博 / 毒品
    { word: "博彩", cat: "赌博毒品" },
    { word: "赌球", cat: "赌博毒品" },
    { word: "毒品", cat: "赌博毒品" },
    { word: "冰毒", cat: "赌博毒品" }
    // 真机在此追加：完整敏感词库 + 竞品品牌名（方案 C 人设对货盘保护）
  ];

  // 正则拦截：手机号 / 网址 / 社交账号导流 / 提示词注入
  var PATTERNS = [
    { re: /1[3-9]\d{9}/, cat: "手机号", hint: "别留手机号，海报会上公共大屏" },
    { re: /\d{3,4}[-\s]?\d{3,4}[-\s]?\d{4}/, cat: "电话号", hint: "别留电话，海报会上公共大屏" },
    { re: /(https?:\/\/|www\.|\.com\b|\.cn\b|\.net\b|\.org\b|t\.cn|bit\.ly)/i, cat: "链接", hint: "不能带链接或网址" },
    { re: /(微信|vx|wechat|qq|ins|ig)\s*[:：号]?\s*[a-z0-9_.-]{3,}/i, cat: "联系方式", hint: "别留联系方式，海报会上公共大屏" },
    { re: /(ignore\s+(all\s+|previous\s+)?instructions?|system\s*prompt|jailbreak|越狱|忽略.{0,8}(指令|提示|规则)|系统指令|提示词)/i, cat: "提示词注入", hint: "这句话像在指挥 AI，换一句此刻的心情吧" }
  ];

  /**
   * 校验一段用户输入。
   * @param {string} text
   * @returns {{ ok: boolean, reason?: string }} reason 为可直接展示给用户的提示
   */
  function check(text) {
    var t = (text || "").trim();
    if (!t) return { ok: false, reason: "内容不能为空" };
    if (t.length > MAX_LEN) {
      return { ok: false, reason: "太长了，压到 " + MAX_LEN + " 字以内" };
    }
    var lower = t.toLowerCase();
    for (var i = 0; i < BLOCKLIST.length; i++) {
      if (lower.indexOf(BLOCKLIST[i].word.toLowerCase()) !== -1) {
        return { ok: false, reason: "命中「" + BLOCKLIST[i].cat + "」类拦截词，换一句再生成" };
      }
    }
    for (var j = 0; j < PATTERNS.length; j++) {
      if (PATTERNS[j].re.test(t)) {
        return { ok: false, reason: PATTERNS[j].hint + "，改一下再生成" };
      }
    }
    return { ok: true };
  }

  return { check: check, MAX_LEN: MAX_LEN };
})();
