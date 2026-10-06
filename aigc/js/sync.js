/* ============================================================
   声纹 SOUNDPRINT · 工位 ↔ 大屏 同步接口（Step 2 定义，Step 3 消费）
   - 通道：BroadcastChannel 'soundprint'，localStorage 事件兜底（同机双窗口演示）
   - 状态机：idle（空闲）/ shooting（拍摄中）/ drawing（生成中）/ reveal（揭晓中）
   - 用法（大屏端 Step 3）：
       SoundprintSync.subscribe(function (msg) { ... });
       SoundprintSync.getLast(); // 进入页面时取最近一次状态，避免假死占用
   ============================================================ */
window.SoundprintSync = (function () {
  "use strict";

  var CHANNEL = "soundprint";
  var KEY = "soundprint:wall:state";
  var VERSION = 1;

  var STATES = Object.freeze({
    IDLE: "idle",
    SHOOTING: "shooting",
    DRAWING: "drawing",
    REVEAL: "reveal"
  });

  var bc = null;
  try {
    if ("BroadcastChannel" in window) bc = new BroadcastChannel(CHANNEL);
  } catch (e) { bc = null; }

  var listeners = [];
  var last = null;

  function normalize(state, payload) {
    return {
      v: VERSION,
      from: "kiosk",
      state: state,
      payload: payload || {},
      ts: Date.now()
    };
  }

  function notify(msg) {
    last = msg;
    listeners.forEach(function (fn) {
      try { fn(msg); } catch (e) { /* 监听者异常不影响发送方 */ }
    });
  }

  /**
   * 发布状态。
   * @param {string} state  idle / shooting / drawing / reveal
   * @param {object} [payload]
   *   idle:     {}
   *   shooting: {}
   *   drawing:  { nickname }
   *   reveal:   { dataURL, title, nickname, line, serial, persona, style }
   */
  function publish(state, payload) {
    var msg = normalize(state, payload);
    // BroadcastChannel 与 storage 事件都只在「其他」窗口触发，本地监听需手动通知
    if (bc) { try { bc.postMessage(msg); } catch (e) {} }
    try {
      localStorage.setItem(KEY, JSON.stringify(msg));
    } catch (e) {
      // 海报 dataURL 可能超出 localStorage 配额：state 已走 BroadcastChannel，忽略即可
    }
    notify(msg);
    return msg;
  }

  /** 订阅状态变化（本窗口 + 其他窗口都会收到）。返回取消订阅函数。 */
  function subscribe(fn) {
    if (typeof fn !== "function") return function () {};
    listeners.push(fn);
    return function unsubscribe() {
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  /** 最近一次状态（优先内存，其次 localStorage），用于大屏打开时恢复现场。 */
  function getLast() {
    if (last) return last;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) last = JSON.parse(raw);
    } catch (e) { last = null; }
    return last;
  }

  if (bc) {
    bc.onmessage = function (ev) {
      if (ev.data && ev.data.v === VERSION) notify(ev.data);
    };
  }

  window.addEventListener("storage", function (ev) {
    if (ev.key !== KEY || !ev.newValue) return;
    try {
      var msg = JSON.parse(ev.newValue);
      if (msg && msg.v === VERSION) notify(msg);
    } catch (e) {}
  });

  return {
    STATES: STATES,
    publish: publish,
    subscribe: subscribe,
    getLast: getLast,
    CHANNEL: CHANNEL
  };
})();
