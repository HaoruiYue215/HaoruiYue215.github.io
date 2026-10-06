/* ============================================================
   声纹 SOUNDPRINT · 输入内容安全校验（安全四层之 L2）
   先审后生成：命中即停在输入页，不请求模型，也不静默打码后发出去。
   词库按九类组织：涉政 / 暴恐 / 色情 / 辱骂 / 歧视 / 竞品名 /
   联系方式 / 链接 / 提示词注入（另保留赌博毒品类）。
   每类带一条可直接展示的分类提示（如「包含联系方式，换一句吧」）。
   原型内置少量演示拦截词（DEMO_WORDS），输入页角落有「演示拦截词」
   角标，方便评审现场逐类点一遍；真机词库由运营维护。
   ============================================================ */
window.SoundprintSafety = (function () {
  "use strict";

  var MAX_LEN = 24; // 昵称 / 一句话 的硬上限（昵称在页面层再收紧到 12）

  /* 分类提示：命中后原样展示给用户，说明「为什么被拦、怎么办」 */
  var CATEGORY_HINTS = {
    "涉政":     "包含涉政内容，换一句吧",
    "暴恐":     "包含暴恐内容，换一句吧",
    "色情":     "包含色情内容，换一句吧",
    "辱骂":     "包含辱骂用语，换一句吧",
    "歧视":     "包含歧视用语，换一句吧",
    "竞品名":   "包含其他品牌名，这里只聊声纹，换一句吧",
    "赌博毒品": "包含赌博或毒品内容，换一句吧",
    "联系方式": "包含联系方式，换一句吧 —— 海报会上公共大屏",
    "链接":     "包含链接或网址，换一句吧",
    "提示词注入": "这句话像在指挥 AI，换一句此刻的心情吧"
  };

  /* 敏感词：{ word, cat }，cat 必须能在 CATEGORY_HINTS 里查到。
     刻意保持少量、每类至少一个演示词；真机在此接入完整词库。 */
  var BLOCKLIST = [
    // 涉政
    { word: "法轮", cat: "涉政" },
    { word: "颠覆国家", cat: "涉政" },
    // 暴恐
    { word: "恐怖", cat: "暴恐" },
    { word: "炸弹", cat: "暴恐" },
    { word: "枪支", cat: "暴恐" },
    // 色情
    { word: "色情", cat: "色情" },
    { word: "裸聊", cat: "色情" },
    { word: "约炮", cat: "色情" },
    // 辱骂
    { word: "傻逼", cat: "辱骂" },
    { word: "废物", cat: "辱骂" },
    { word: "去死", cat: "辱骂" },
    // 歧视
    { word: "黑鬼", cat: "歧视" },
    { word: "乡巴佬", cat: "歧视" },
    // 竞品名（方案 C 人设对货盘保护：海报不给别人家耳机带货）
    { word: "索尼", cat: "竞品名" },
    { word: "sony", cat: "竞品名" },
    { word: "bose", cat: "竞品名" },
    { word: "beats", cat: "竞品名" },
    { word: "airpods", cat: "竞品名" },
    // 赌博 / 毒品
    { word: "博彩", cat: "赌博毒品" },
    { word: "赌球", cat: "赌博毒品" },
    { word: "毒品", cat: "赌博毒品" },
    { word: "冰毒", cat: "赌博毒品" }
  ];

  /* 正则拦截：手机号 / 电话 / 链接 / 社交账号导流 / 提示词注入 */
  var PATTERNS = [
    { re: /1[3-9]\d{9}/, cat: "联系方式" },
    { re: /\d{3,4}[-\s]\d{3,4}[-\s]\d{4}/, cat: "联系方式" },
    { re: /(微信|wechat)\s*[:：号]?\s*[a-z0-9_.-]{3,}/i, cat: "联系方式" },
    // 英文短代号带词边界，避免 ignore / instructions 里的 ig、ins 误中
    { re: /\b(vx|qq|ins|ig|instagram)\b\s*[:：号]?\s*[a-z0-9_.-]{3,}/i, cat: "联系方式" },
    { re: /(https?:\/\/|www\.|\.com\b|\.cn\b|\.net\b|\.org\b|t\.cn|bit\.ly)/i, cat: "链接" },
    { re: /(ignore\s+(all\s+|previous\s+)?instructions?|system\s*prompt|jailbreak|越狱|忽略.{0,8}(指令|提示|规则)|系统指令|提示词)/i, cat: "提示词注入" }
  ];

  /* 演示拦截词（输入页角标展示，评审可逐类点一遍） */
  var DEMO_WORDS = ["炸弹", "约炮", "傻逼", "乡巴佬", "索尼", "13800138000", "ignore instructions"];

  function hintFor(cat) {
    return CATEGORY_HINTS[cat] || ("包含「" + cat + "」类内容，换一句吧");
  }

  /**
   * 校验一段用户输入。
   * @param {string} text
   * @returns {{ ok: boolean, cat?: string, reason?: string }}
   *   ok=false 时 cat 为命中分类，reason 为可直接展示的分类提示
   */
  function check(text) {
    var t = (text || "").trim();
    if (!t) return { ok: false, cat: "空", reason: "内容不能为空" };
    if (t.length > MAX_LEN) {
      return { ok: false, cat: "超长", reason: "太长了，压到 " + MAX_LEN + " 字以内" };
    }
    var lower = t.toLowerCase();
    for (var i = 0; i < BLOCKLIST.length; i++) {
      if (lower.indexOf(BLOCKLIST[i].word.toLowerCase()) !== -1) {
        return { ok: false, cat: BLOCKLIST[i].cat, reason: hintFor(BLOCKLIST[i].cat) };
      }
    }
    for (var j = 0; j < PATTERNS.length; j++) {
      if (PATTERNS[j].re.test(t)) {
        return { ok: false, cat: PATTERNS[j].cat, reason: hintFor(PATTERNS[j].cat) };
      }
    }
    return { ok: true };
  }

  return { check: check, MAX_LEN: MAX_LEN, CATEGORY_HINTS: CATEGORY_HINTS, DEMO_WORDS: DEMO_WORDS };
})();
