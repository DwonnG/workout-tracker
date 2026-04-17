(function () {
  var WT = window.WT;
  var timerEl, countdownEl, labelEl, pauseBtn, skipBtn, addBtn;
  var remaining = 0, running = false, intervalId = null;
  var TIMER_PREFS_KEY = 'wt:timerPrefs';

  WT.TIMER_DEFAULTS = { work: 90, warmup: 60, drop: 30, failure: 120 };

  WT.loadTimerPrefs = function () {
    try {
      var raw = localStorage.getItem(TIMER_PREFS_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object') return o;
      }
    } catch (e) { /* use defaults */ }
    return null;
  };

  WT.saveTimerPrefs = function (prefs) {
    localStorage.setItem(TIMER_PREFS_KEY, JSON.stringify(prefs));
  };

  WT.getRestDuration = function (setType) {
    var prefs = WT.loadTimerPrefs() || {};
    var val = prefs[setType];
    if (val != null && !isNaN(val)) return Number(val);
    return WT.TIMER_DEFAULTS[setType] || 90;
  };

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m > 0 ? m + ':' : '') + (m > 0 ? String(s).padStart(2, '0') : s + 's');
  }

  function tick() {
    if (remaining <= 0) {
      stopTimer();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      labelEl.textContent = 'Rest complete';
      countdownEl.textContent = '0s';
      setTimeout(hideTimer, 2500);
      return;
    }
    remaining--;
    countdownEl.textContent = formatTime(remaining);
  }

  function stopTimer() {
    running = false;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    if (pauseBtn) pauseBtn.textContent = '\u25b6';
  }

  function hideTimer() {
    stopTimer();
    remaining = 0;
    if (timerEl) timerEl.classList.remove('visible');
  }

  WT.startRestTimer = function (setType) {
    if (!timerEl) return;
    var dur = WT.getRestDuration(setType);
    if (dur <= 0) return;
    stopTimer();
    remaining = dur;
    countdownEl.textContent = formatTime(remaining);
    labelEl.textContent = 'Rest';
    timerEl.classList.add('visible');
    running = true;
    pauseBtn.textContent = '\u23f8';
    intervalId = setInterval(tick, 1000);
  };

  WT.initTimer = function () {
    timerEl = document.getElementById('restTimerBar');
    if (!timerEl) return;
    countdownEl = timerEl.querySelector('.timer-countdown');
    labelEl = timerEl.querySelector('.timer-label');
    pauseBtn = timerEl.querySelector('.timer-pause');
    skipBtn = timerEl.querySelector('.timer-skip');
    addBtn = timerEl.querySelector('.timer-add');

    pauseBtn.addEventListener('click', function () {
      if (running) {
        stopTimer();
      } else if (remaining > 0) {
        running = true;
        pauseBtn.textContent = '\u23f8';
        intervalId = setInterval(tick, 1000);
      }
    });

    skipBtn.addEventListener('click', hideTimer);

    addBtn.addEventListener('click', function () {
      remaining += 30;
      if (!running && remaining > 0) {
        running = true;
        pauseBtn.textContent = '\u23f8';
        intervalId = setInterval(tick, 1000);
      }
      countdownEl.textContent = formatTime(remaining);
    });
  };
})();
