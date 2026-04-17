(function () {
  var WT = window.WT;
  var modalEl, saveBtn;
  var timerWrap;
  var timerInputs = {};

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

  WT.openSettings = function () {
    renderTimerPrefs();
    modalEl.classList.add('open');
  };

  WT.closeSettings = function () {
    modalEl.classList.remove('open');
  };

  WT.initSettings = function () {
    modalEl = document.getElementById('settingsModal');
    timerWrap = document.getElementById('settingsTimerList');
    saveBtn = document.getElementById('settingsSaveBtn');

    document.getElementById('settingsModalClose').addEventListener('click', WT.closeSettings);
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) WT.closeSettings(); });

    saveBtn.addEventListener('click', function () {
      var tPrefs = {};
      WT.SET_TYPE_ORDER.forEach(function (key) {
        if (timerInputs[key]) tPrefs[key] = parseInt(timerInputs[key].value, 10) || 0;
      });
      WT.saveTimerPrefs(tPrefs);

      WT.closeSettings();
      WT.render();
      WT.showToast('Settings saved', 'var(--green)');
    });
  };
})();
