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
      goal: document.getElementById('proteinGoal'),
      printGoal: document.getElementById('printGoal'),
      navPrev: document.getElementById('navPrev'),
      navNext: document.getElementById('navNext'),
      printBtn: document.getElementById('printBtn'),
      clearBtn: document.getElementById('clearBtn'),
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
    WT.viewMode = (function () { var v = localStorage.getItem(WT.VIEW_KEY); return v === 'day' || v === 'week' || v === 'month' ? v : 'day'; })();

    WT.initFoodModal();

    document.querySelectorAll('#viewSeg .seg-btn').forEach(function (btn) {
      if (btn.dataset.view === WT.viewMode) btn.classList.add('active'); else btn.classList.remove('active');
      btn.addEventListener('click', function () {
        document.querySelectorAll('#viewSeg .seg-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active'); WT.viewMode = btn.dataset.view; localStorage.setItem(WT.VIEW_KEY, WT.viewMode); WT.render();
      });
    });

    WT.el.goal.addEventListener('change', function () {
      var gy = WT.viewMode === 'month' ? WT.view.y : WT.focus.y, gm = WT.viewMode === 'month' ? WT.view.m : WT.focus.m;
      var d = WT.loadMonth(gy, gm); d.goal = parseInt(WT.el.goal.value, 10) || 0; WT.saveMonth(gy, gm, d); WT.render();
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

    var menuWrap = document.getElementById('menuWrap');
    document.getElementById('menuBtn').addEventListener('click', function (e) { e.stopPropagation(); menuWrap.classList.toggle('open'); });
    document.addEventListener('click', function () { menuWrap.classList.remove('open'); });

    WT.el.printBtn.addEventListener('click', function () { menuWrap.classList.remove('open'); window.print(); });
    WT.el.clearBtn.addEventListener('click', function () {
      menuWrap.classList.remove('open');
      var label = WT.viewMode === 'month' ? WT.MONTH_LONG[WT.view.m] + ' ' + WT.view.y : 'this period';
      if (!confirm('Clear all entries for ' + label + '?')) return;
      if (WT.viewMode === 'month') { WT.saveMonth(WT.view.y, WT.view.m, { goal: parseInt(WT.el.goal.value, 10) || 0, days: {} }); }
      else { var mn = WT.monOf(WT.focus.y, WT.focus.m, WT.focus.d); for (var i = 0; i < 7; i++) { var fd = WT.addD(mn.y, mn.m, mn.d, i); var md = WT.loadMonth(fd.y, fd.m); delete md.days[WT.iso(fd.y, fd.m, fd.d)]; WT.saveMonth(fd.y, fd.m, md); } }
      WT.render();
    });

    document.getElementById('lockBtn').addEventListener('click', function () { menuWrap.classList.remove('open'); WT.lockApp(); });

    var spb = document.getElementById('savePlanBtn'), rpb = document.getElementById('resetPlanBtn');
    if (spb) spb.addEventListener('click', function () { WT.savePlan(WT.readPlanForm()); WT.render(); WT.showToast('Plan saved', 'var(--green)'); });
    if (rpb) rpb.addEventListener('click', function () { if (!confirm('Reset all seven days to the built-in default plan?')) return; localStorage.removeItem(WT.PLAN_KEY); WT.fbSet('plan', null); WT.buildPlanFields(); WT.render(); });

    WT.migrateOldData();
    WT.buildPlanFields();
    WT.render();
    WT.pullFromFirebase();

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
    WT.unlockApp(storedHash);
  } else {
    WT.showPinScreen();
  }
})();
