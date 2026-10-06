/* ============================================================
   声纹 SOUNDPRINT · 海报本地存档（Step 3）
   - localStorage 键 soundprint:posters，最新在前，上限 9 张
   - 每条存两份图：dataURL（768 宽，分享页展示/下载）+ thumb（墙九宫格）
   - 同机双窗口（工位 / 大屏 / 分享页）同源共享；换设备扫码读不到，
     分享页对此有空态说明
   - 写不进去时逐张淘汰最旧的；仍失败则静默放弃，不影响主流程
   ============================================================ */
window.SoundprintStore = (function () {
  "use strict";

  var KEY = "soundprint:posters";
  var CAP = 9;

  var MAIN_W = 768;   // 分享页用图：768×960 JPEG
  var MAIN_Q = 0.8;
  var THUMB_W = 360;  // 九宫格用图：360×450 JPEG
  var THUMB_Q = 0.72;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function write(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr));
  }

  /** 最新在前；id（即编号 SP-XXXX）去重。 */
  function list() {
    return read();
  }

  function get(id) {
    if (!id) return null;
    var arr = read();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id === id) return arr[i];
    }
    return null;
  }

  /**
   * 存入一张海报（已备好图的情况）。
   * @param {object} rec { id, dataURL, thumb, title, nickname, line, serial, persona, style, ts }
   */
  function save(rec) {
    if (!rec || !rec.id) return false;
    var arr = read().filter(function (r) { return r && r.id !== rec.id; });
    arr.unshift(rec);
    while (arr.length > CAP) arr.pop();
    // 配额兜底：逐张淘汰最旧，直到写得进或清空
    while (arr.length) {
      try {
        write(arr);
        return true;
      } catch (e) {
        arr.pop();
      }
    }
    try { write([]); } catch (e) {}
    return false;
  }

  /** dataURL → 指定宽高的 JPEG dataURL（等比缩放，海报恒为 4:5 竖版） */
  function downscale(dataURL, w, q) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        try {
          var h = Math.round((img.naturalHeight / img.naturalWidth) * w);
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", q));
        } catch (e) { reject(e); }
      };
      img.onerror = function () { reject(new Error("海报图解码失败")); };
      img.src = dataURL;
    });
  }

  /**
   * 从完整尺寸 dataURL 入库（自动降采样出主图与缩略图）。
   * @param {string} dataURL 完整海报（JPEG/PNG dataURL）
   * @param {object} meta    { title, nickname, line, serial, persona, style }
   * @returns {Promise<object|null>} 入库成功的记录；失败为 null
   */
  function saveFromDataURL(dataURL, meta) {
    if (!dataURL || !meta || !meta.serial) return Promise.resolve(null);
    return Promise.all([
      downscale(dataURL, MAIN_W, MAIN_Q),
      downscale(dataURL, THUMB_W, THUMB_Q)
    ]).then(function (imgs) {
      var rec = {
        id: meta.serial,
        dataURL: imgs[0],
        thumb: imgs[1],
        title: meta.title || "",
        nickname: meta.nickname || "",
        line: meta.line || "",
        serial: meta.serial,
        persona: meta.persona || "",
        style: meta.style || "",
        ts: Date.now()
      };
      return save(rec) ? rec : null;
    }).catch(function () { return null; });
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  return {
    KEY: KEY,
    CAP: CAP,
    list: list,
    get: get,
    save: save,
    saveFromDataURL: saveFromDataURL,
    clear: clear
  };
})();
