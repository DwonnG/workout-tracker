(function () {
  var WT = window.WT;
  var modalEl, saveBtn;
  var timerWrap;
  var timerInputs = {};
  var weightInput, bodyFatInput;

  function renderTimerPrefs() {
    timerWrap.innerHTML = '';
    var prefs = WT.loadTimerPrefs() || {};
    WT.SET_TYPE_ORDER.forEach(function (key) {
      var st = WT.SET_TYPES[key];
      var def = WT.TIMER_DEFAULTS[key];
      var val = (prefs[key] != null) ? prefs[key] : def;

      var row = document.createElement('div');
      row.className = 'settings-timer-row';

      var lbl = document.createElement('span');
      lbl.className = 'settings-timer-label';
      lbl.textContent = st.long;
      lbl.style.color = st.color;

      var inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'settings-timer-input';
      inp.min = '0';
      inp.max = '600';
      inp.step = '15';
      inp.value = String(val);
      inp.setAttribute('aria-label', st.long + ' rest seconds');

      var unit = document.createElement('span');
      unit.className = 'settings-timer-unit';
      unit.textContent = 'sec';

      row.appendChild(lbl);
      row.appendChild(inp);
      row.appendChild(unit);
      timerWrap.appendChild(row);
      timerInputs[key] = inp;
    });
  }

  function todayKey() {
    var d = new Date();
    return { y: d.getFullYear(), m: d.getMonth(), id: WT.iso(d.getFullYear(), d.getMonth(), d.getDate()) };
  }

  function loadTodayMetrics() {
    var t = todayKey();
    var md = WT.loadMonth(t.y, t.m);
    var rec = WT.ensureRec(md, t.id);
    weightInput.value = rec.bodyWeight || '';
    bodyFatInput.value = rec.bodyFat || '';
  }

  function saveTodayMetrics() {
    var t = todayKey();
    var md = WT.loadMonth(t.y, t.m);
    WT.ensureRec(md, t.id);
    var wv = parseFloat(weightInput.value);
    var fv = parseFloat(bodyFatInput.value);
    if (!isNaN(wv) && wv > 0) md.days[t.id].bodyWeight = wv; else delete md.days[t.id].bodyWeight;
    if (!isNaN(fv) && fv > 0) md.days[t.id].bodyFat = fv; else delete md.days[t.id].bodyFat;
    WT.saveMonth(t.y, t.m, md);
  }

  WT.openSettings = function () {
    renderTimerPrefs();
    loadTodayMetrics();
    modalEl.classList.add('open');
  };

  WT.closeSettings = function () {
    modalEl.classList.remove('open');
  };

  WT.initSettings = function () {
    modalEl = document.getElementById('settingsModal');
    timerWrap = document.getElementById('settingsTimerList');
    saveBtn = document.getElementById('settingsSaveBtn');
    weightInput = document.getElementById('settingsWeight');
    bodyFatInput = document.getElementById('settingsBodyFat');

    document.getElementById('settingsModalClose').addEventListener('click', WT.closeSettings);
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) WT.closeSettings(); });

    saveBtn.addEventListener('click', function () {
      var tPrefs = {};
      WT.SET_TYPE_ORDER.forEach(function (key) {
        if (timerInputs[key]) tPrefs[key] = parseInt(timerInputs[key].value, 10) || 0;
      });
      WT.saveTimerPrefs(tPrefs);
      saveTodayMetrics();

      WT.closeSettings();
      WT.render();
      WT.showToast('Settings saved', 'var(--green)');
    });
  };
})();
