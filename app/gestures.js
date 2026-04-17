(function () {
  var WT = window.WT;
  var startX = 0, startY = 0, swiping = false;
  var MIN_DIST = 50, MAX_Y = 80;

  WT.initGestures = function () {
    var cal = WT.el.cal;
    if (!cal) return;

    cal.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });

    cal.addEventListener('touchend', function (e) {
      if (!swiping) return;
      swiping = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      if (Math.abs(dy) > MAX_Y) return;
      if (Math.abs(dx) < MIN_DIST) return;

      if (dx < 0) {
        if (WT.el.navNext) WT.el.navNext.click();
      } else {
        if (WT.el.navPrev) WT.el.navPrev.click();
      }
    }, { passive: true });
  };
})();
