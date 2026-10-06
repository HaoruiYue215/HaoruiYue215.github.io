/* ============================================================
   声纹 SOUNDPRINT · 扫码落地页（Step 3）
   读取顺序：?id=SP-XXXX → SoundprintStore 存档
             → SoundprintSync 最近一次揭晓（同机刚生成完就扫码）
             → 空态（引导回工位）
   ============================================================ */
(function () {
  "use strict";

  var Store = window.SoundprintStore;
  var Sync = window.SoundprintSync;

  var PERSONA_CN = { pop: "流行", electronic: "电子", rock: "摇滚", folk: "民谣" };
  var STYLE_CN = { film: "胶片噪点", neon: "赛博霓虹", acid: "酸性海报", ink: "水墨梦核" };
  var SKU_CN = { pop: "暖金单元", electronic: "霓虹低频", rock: "现场失真", folk: "人声突出" };

  function $(sel) { return document.querySelector(sel); }

  function getId() {
    try {
      return new URLSearchParams(location.search).get("id");
    } catch (e) {
      return null;
    }
  }

  /** 统一成 { dataURL, title, nickname, line, serial, persona, style } */
  function loadPoster() {
    var id = getId();
    if (id) {
      var rec = Store.get(id);
      if (rec) return rec;
    }
    // 回退：最近一次揭晓（同机刚生成完直接扫码的场景）
    var last = Sync.getLast();
    if (last && last.state === Sync.STATES.REVEAL && last.payload && last.payload.dataURL) {
      if (!id || last.payload.serial === id) {
        return last.payload;
      }
    }
    // 再退：没给 id 时取存档里最新一张
    if (!id) {
      var all = Store.list();
      if (all.length) return all[0];
    }
    return null;
  }

  function render(p) {
    $("#poster-img").src = p.dataURL;
    $("#poster-title").textContent = p.title || "声纹海报";

    var bits = [];
    if (p.nickname) bits.push("@" + p.nickname);
    var personaCn = PERSONA_CN[p.persona];
    var styleCn = STYLE_CN[p.style];
    if (personaCn && styleCn) bits.push(personaCn + " × " + styleCn);
    if (SKU_CN[p.persona]) bits.push("SOUNDPRINT " + SKU_CN[p.persona] + "款");
    $("#poster-who").textContent = bits.join(" · ");

    $("#poster-serial").textContent = "编号 " + (p.serial || p.id || "----");

    var btn = $("#btn-save");
    btn.href = p.dataURL;
    btn.download = "soundprint-" + (p.serial || p.id || "poster") + ".jpg";

    $("#share-has").hidden = false;
    document.title = (p.title ? p.title + " · " : "") + "声纹 SOUNDPRINT";
  }

  function renderEmpty() {
    $("#share-empty").hidden = false;
  }

  var poster = loadPoster();
  if (poster && poster.dataURL) {
    render(poster);
  } else {
    renderEmpty();
  }
})();
