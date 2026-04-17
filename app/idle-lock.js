(function () {
  var WT = window.WT;
  var IDLE_MS = 15 * 60 * 1000;
  var timer = null;
  var throttled = false;

  function onActivity() {
    if (throttled) return;
    throttled = true;
    setTimeout(function () { throttled = false; }, 1000);
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (WT.appInited && WT.lockApp) WT.lockApp();
    }, IDLE_MS);
  }

  WT.startIdleTimer = function () {
    var events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(function (evt) {
      document.addEventListener(evt, onActivity, { passive: true });
    });
    onActivity();
  };

  WT.stopIdleTimer = function () {
    clearTimeout(timer);
    timer = null;
  };
})();
