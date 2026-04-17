(function () {
  var WT = window.WT;
  var toastEl, toastTimer = null;

  WT.showToast = function (msg, color) {
    toastEl.textContent = msg;
    toastEl.style.borderColor = color || 'var(--border-color)';
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2500);
  };

  WT.updateTitle = function () {
    if (WT.viewMode === 'month') { WT.el.title.textContent = WT.MONTH_LONG[WT.view.m] + ' ' + WT.view.y; return; }
    if (WT.viewMode === 'week') {
      var mn = WT.monOf(WT.focus.y, WT.focus.m, WT.focus.d), sn = WT.addD(mn.y, mn.m, mn.d, 6);
      WT.el.title.textContent = 'Week of ' + WT.MONTH_SHORT[mn.m] + ' ' + mn.d + ' \u2013 ' + WT.MONTH_SHORT[sn.m] + ' ' + sn.d + ', ' + mn.y; return;
    }
    var dw = new Date(WT.focus.y, WT.focus.m, WT.focus.d).getDay();
    WT.el.title.textContent = WT.DOW_LABEL[dw] + ', ' + WT.MONTH_LONG[WT.focus.m] + ' ' + WT.focus.d + ', ' + WT.focus.y;
  };

  WT.initApp = function (userHash) {
    if (WT.appInited) return;
    WT.appInited = true;

    WT.db = WT.getFirebaseDb();
    WT.fbRoot = 'tracker/' + userHash;

    toastEl = document.getElementById('toast');

    WT.el = {
      cal: document.getElementById('calendar'),
      title: document.getElementById('viewTitle'),
      printGoal: document.getElementById('printGoal'),
      navPrev: document.getElementById('navPrev'),
      navNext: document.getElementById('navNext'),
      statsRow: document.getElementById('statsRow'),
      syncDot: document.getElementById('syncDot')
    };

    var today = new Date();
    WT.view = { y: today.getFullYear(), m: today.getMonth() };
    WT.focus = (function () {
      try {
        var r = localStorage.getItem(WT.FOCUS_KEY);
        if (r && /^\d{4}-\d{2}-\d{2}$/.test(r)) { var p = r.split('-').map(Number); return { y: p[0], m: p[1] - 1, d: p[2] }; }
      } catch (e) { /* use default */ }
      return { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
    })();
    WT.viewMode = (function () { var v = localStorage.getItem(WT.VIEW_KEY); return v === 'day' || v === 'week' || v === 'month' || v === 'history' ? v : 'day'; })();

    WT.renderGoalInputs = function () {};

    WT.currentGoalValue = function (key) {
      var gy = WT.viewMode === 'month' ? WT.view.y : WT.focus.y;
      var gm = WT.viewMode === 'month' ? WT.view.m : WT.focus.m;
      var md = WT.loadMonth(gy, gm);
      return WT.getGoal(md, key);
    };

    WT.initFoodModal();
    WT.initSettings();
    WT.initNutrition();
    WT.initTimer();
    WT.initCharts();
    WT.initTemplates();
    WT.initGestures();
    WT.initExercisePicker();

    document.getElementById('settingsBtn').addEventListener('click', function () {
      WT.openSettings();
    });

    document.getElementById('templatesBtn').addEventListener('click', function () {
      WT.closeSettings();
      WT.openTemplateModal();
    });

    document.getElementById('exportJsonBtn').addEventListener('click', function () {
      WT.closeSettings();
      WT.exportJSON();
    });

    document.getElementById('exportCsvBtn').addEventListener('click', function () {
      WT.closeSettings();
      WT.exportCSV();
    });

    var navBtns = document.querySelectorAll('#bottomNav .bnav-item[data-view]');
    WT.syncNav = function () {
      navBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.view === WT.viewMode); });
    };
    WT.syncNav();
    navBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        WT.viewMode = btn.dataset.view;
        localStorage.setItem(WT.VIEW_KEY, WT.viewMode);
        WT.syncNav();
        WT.render();
      });
    });

    WT.el.navPrev.addEventListener('click', function () {
      if (WT.viewMode === 'month') { if (WT.view.m === 0) { WT.view.m = 11; WT.view.y--; } else WT.view.m--; }
      else if (WT.viewMode === 'week') { var mn = WT.monOf(WT.focus.y, WT.focus.m, WT.focus.d); WT.focus = WT.addD(mn.y, mn.m, mn.d, -7); WT.saveFocus(); }
      else { WT.focus = WT.addD(WT.focus.y, WT.focus.m, WT.focus.d, -1); WT.saveFocus(); } WT.render();
    });
    WT.el.navNext.addEventListener('click', function () {
      if (WT.viewMode === 'month') { if (WT.view.m === 11) { WT.view.m = 0; WT.view.y++; } else WT.view.m++; }
      else if (WT.viewMode === 'week') { var mn = WT.monOf(WT.focus.y, WT.focus.m, WT.focus.d); WT.focus = WT.addD(mn.y, mn.m, mn.d, 7); WT.saveFocus(); }
      else { WT.focus = WT.addD(WT.focus.y, WT.focus.m, WT.focus.d, 1); WT.saveFocus(); } WT.render();
    });

    document.getElementById('navToday').addEventListener('click', function () {
      var t = new Date();
      WT.focus = { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
      WT.view = { y: t.getFullYear(), m: t.getMonth() };
      WT.saveFocus(); WT.render();
    });

    document.getElementById('printBtn').addEventListener('click', function () { WT.closeSettings(); window.print(); });
    document.getElementById('clearBtn').addEventListener('click', function () {
      WT.closeSettings();
      var label = WT.viewMode === 'month' ? WT.MONTH_LONG[WT.view.m] + ' ' + WT.view.y : 'this period';
      if (!confirm('Clear all entries for ' + label + '?')) return;
      if (WT.viewMode === 'month') { var curMd = WT.loadMonth(WT.view.y, WT.view.m); WT.saveMonth(WT.view.y, WT.view.m, { goal: curMd.goal || 0, goals: curMd.goals || {}, days: {} }); }
      else { var mn = WT.monOf(WT.focus.y, WT.focus.m, WT.focus.d); for (var i = 0; i < 7; i++) { var fd = WT.addD(mn.y, mn.m, mn.d, i); var md = WT.loadMonth(fd.y, fd.m); delete md.days[WT.iso(fd.y, fd.m, fd.d)]; WT.saveMonth(fd.y, fd.m, md); } }
      WT.render();
    });

    document.getElementById('lockBtn').addEventListener('click', function () { WT.lockApp(); });

    var editorModal = document.getElementById('editorModal');
    var editorTabs = document.querySelectorAll('#editorTabs .editor-tab');
    var tabPlan = document.getElementById('editorTabPlan');
    var tabNutrition = document.getElementById('editorTabNutrition');

    function switchEditorTab(tab) {
      editorTabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
      tabPlan.style.display = tab === 'plan' ? '' : 'none';
      tabNutrition.style.display = tab === 'nutrition' ? '' : 'none';
      if (tab === 'plan') WT.buildPlanFields();
      if (tab === 'nutrition') WT.openNutritionTab();
    }

    editorTabs.forEach(function (t) {
      t.addEventListener('click', function () { switchEditorTab(t.dataset.tab); });
    });

    document.getElementById('editPlanBtn').addEventListener('click', function () {
      switchEditorTab('plan');
      editorModal.classList.add('open');
    });
    document.getElementById('editorModalClose').addEventListener('click', function () { editorModal.classList.remove('open'); });
    editorModal.addEventListener('click', function (e) { if (e.target === editorModal) editorModal.classList.remove('open'); });

    var spb = document.getElementById('savePlanBtn'), rpb = document.getElementById('resetPlanBtn');
    if (spb) spb.addEventListener('click', function () { WT.savePlan(WT.readPlanForm()); editorModal.classList.remove('open'); WT.render(); WT.showToast('Plan saved', 'var(--green)'); });
    if (rpb) rpb.addEventListener('click', function () { if (!confirm('Reset all seven days to the built-in default plan?')) return; localStorage.removeItem(WT.PLAN_KEY); WT.fbSet('plan', null); WT.buildPlanFields(); WT.render(); });

    WT.migrateOldData();
    WT.render();
    WT.pullFromFirebase();
    WT.startIdleTimer();

    if (WT.shouldShowTour()) {
      setTimeout(function () { WT.startTour(); }, 600);
    }

    var fbRef = WT.db.ref(WT.fbRoot);
    fbRef.on('value', function (snap) {
      var data = snap.val(); if (!data) return;
      WT.applyFirebaseData(data);
      WT.render();
      WT.el.syncDot.className = 'sync-dot'; WT.el.syncDot.title = 'Synced';
    });
    WT.fbListener = function () { fbRef.off(); };
  };

  var storedHash = localStorage.getItem('wt:pinHash');
  if (storedHash) {
    WT.trackedMacros = WT.loadPrefs();
    WT.unlockApp(storedHash);
  } else {
    WT.showPinScreen();
  }
})();
