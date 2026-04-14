(function () {
  var WT = window.WT;

  WT.attachMonthCell = function (cell, y, m, d, snap) {
    var id = WT.iso(y, m, d), md = WT.loadMonth(y, m), rec = WT.ensureRec(md, id);
    var gv = md.goal != null ? md.goal : parseInt(WT.el.goal.value, 10) || 0;
    var n = new Date(); if (n.getFullYear() === y && n.getMonth() === m && n.getDate() === d) cell.classList.add('today');
    var dow = new Date(y, m, d).getDay(), lines = WT.planLines(snap, dow), dt = WT.dayType(lines, dow);
    var pv = parseInt(rec.p, 10), proteinHit = (!isNaN(pv) && gv > 0 && pv >= gv);

    var top = document.createElement('div'); top.className = 'mc-top';
    var num = document.createElement('span'); num.className = 'day-num'; num.textContent = String(d);
    var dots = document.createElement('div'); dots.className = 'mc-dots';
    dots.innerHTML = '<span class="dot dot-lift' + (rec.lift ? ' on' : '') + '"></span><span class="dot dot-run' + (rec.run ? ' on' : '') + '"></span><span class="dot dot-protein' + (proteinHit ? ' on' : '') + '"></span>';
    top.appendChild(num); top.appendChild(dots); cell.appendChild(top);

    var lb = document.createElement('div'); lb.className = 'mc-label'; lb.textContent = dt.label;
    lb.style.color = dt.color; cell.appendChild(lb);
  };

  WT.attachWeekCard = function (card, y, m, d, snap) {
    var id = WT.iso(y, m, d), md = WT.loadMonth(y, m), rec = WT.ensureRec(md, id);
    var gv = md.goal != null ? md.goal : parseInt(WT.el.goal.value, 10) || 0;
    var n = new Date(); if (n.getFullYear() === y && n.getMonth() === m && n.getDate() === d) card.classList.add('today');
    var dow = new Date(y, m, d).getDay(), lines = WT.planLines(snap, dow), dt = WT.dayType(lines, dow);

    var header = document.createElement('div'); header.className = 'wc-header';
    var sub = document.createElement('div'); sub.className = 'week-sub'; sub.textContent = WT.DOW_SHORT[dow] + ' ' + d;
    var badge = document.createElement('span'); badge.className = 'wc-type'; badge.textContent = dt.label;
    badge.style.color = dt.color; badge.style.background = dt.bg;
    header.appendChild(sub); header.appendChild(badge); card.appendChild(header);

    var tracking = document.createElement('div'); tracking.className = 'wc-tracking';
    tracking.appendChild(WT.makeCheck('Lift', 'tag-lift', !!rec.lift, id, y, m, id, 'lift'));
    tracking.appendChild(WT.makeCheck('Run', 'tag-run', !!rec.run, id, y, m, id, 'run'));

    var pr = document.createElement('div'); pr.className = 'row-inline';
    var pl = document.createElement('span'); pl.className = 'plabel'; pl.textContent = 'Protein'; pr.appendChild(pl);
    var pi = document.createElement('input'); pi.type = 'number'; pi.min = '0'; pi.max = '500'; pi.step = '1'; pi.placeholder = 'g';
    pi.value = rec.p === '' || rec.p == null ? '' : String(rec.p); pi.setAttribute('aria-label', 'Protein ' + id);
    var st = document.createElement('span'); st.className = 'hit';
    function upd() { var v = parseInt(pi.value, 10); if (isNaN(v) || pi.value === '') { st.textContent = ''; st.className = 'hit'; return; } if (v >= gv && gv > 0) { st.textContent = '\u2713'; st.className = 'hit'; } else if (gv > 0) { st.textContent = '\u2014'; st.className = 'miss'; } else st.textContent = ''; }
    upd();
    pi.addEventListener('input', function () {
      var dt2 = WT.loadMonth(y, m); WT.ensureRec(dt2, id); dt2.days[id].p = pi.value;
      if (dt2.goal == null) dt2.goal = parseInt(WT.el.goal.value, 10) || 0;
      WT.saveMonth(y, m, dt2); upd(); WT.renderStats();
    });
    pr.appendChild(pi); pr.appendChild(st); tracking.appendChild(pr);
    card.appendChild(tracking);

    var planDiv = document.createElement('div'); planDiv.className = 'wc-plan';
    planDiv.appendChild(WT.buildPlanList(snap, dow, ''));
    card.appendChild(planDiv);
  };

  WT.buildFoodLog = function (panel, y, m, id, gv) {
    var md = WT.loadMonth(y, m), rec = WT.ensureRec(md, id);

    var wrap = document.createElement('div'); wrap.className = 'food-log';
    var header = document.createElement('div'); header.className = 'food-log-header';
    var title = document.createElement('span'); title.className = 'food-log-title'; title.textContent = 'Protein Log';
    var addBtn = document.createElement('button'); addBtn.className = 'food-add-btn';
    addBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Food';
    header.appendChild(title); header.appendChild(addBtn);
    wrap.appendChild(header);

    var entriesDiv = document.createElement('div'); entriesDiv.className = 'food-entries';
    var totalDiv = document.createElement('div'); totalDiv.className = 'food-total';
    wrap.appendChild(entriesDiv);
    wrap.appendChild(totalDiv);

    function calcTotal() { var sum = 0; rec.foods.forEach(function (f) { sum += f.p || 0; }); return sum; }

    function refreshEntries() {
      entriesDiv.innerHTML = '';
      if (!rec.foods.length) {
        var empty = document.createElement('div'); empty.className = 'food-empty'; empty.textContent = 'No foods logged yet \u2014 tap Add Food to start';
        entriesDiv.appendChild(empty);
      }
      rec.foods.forEach(function (f, i) {
        var row = document.createElement('div'); row.className = 'food-entry';
        var nm = document.createElement('span'); nm.className = 'food-entry-name'; nm.textContent = f.name;
        var pg = document.createElement('span'); pg.className = 'food-entry-protein'; pg.textContent = f.p + 'g';
        var del = document.createElement('button'); del.className = 'food-entry-del'; del.textContent = '\u00d7';
        del.setAttribute('aria-label', 'Remove ' + f.name);
        del.addEventListener('click', function () { rec.foods.splice(i, 1); save(); });
        row.appendChild(nm); row.appendChild(pg); row.appendChild(del);
        entriesDiv.appendChild(row);
      });
      refreshTotal();
    }

    function refreshTotal() {
      var sum = calcTotal(), pct = gv > 0 ? Math.min(100, Math.round(sum / gv * 100)) : 0;
      totalDiv.innerHTML = '';
      var lbl = document.createElement('span'); lbl.className = 'food-total-label'; lbl.textContent = 'Total';
      var num = document.createElement('span'); num.className = 'food-total-num'; num.textContent = sum + 'g';
      var bar = document.createElement('div'); bar.className = 'food-total-bar';
      var fill = document.createElement('div'); fill.className = 'food-total-fill';
      fill.style.width = pct + '%';
      fill.style.background = (sum >= gv && gv > 0) ? 'var(--green)' : 'var(--accent)';
      bar.appendChild(fill);
      var goal = document.createElement('span'); goal.className = 'food-total-goal';
      goal.textContent = gv > 0 ? (pct + '% of ' + gv + 'g') : 'no goal set';
      totalDiv.appendChild(lbl); totalDiv.appendChild(num); totalDiv.appendChild(bar); totalDiv.appendChild(goal);
    }

    function save() {
      var dt2 = WT.loadMonth(y, m); WT.ensureRec(dt2, id);
      dt2.days[id].foods = rec.foods;
      var foodTotal = calcTotal(), existing = parseInt(dt2.days[id].p, 10) || 0;
      dt2.days[id].p = String(Math.max(foodTotal, existing));
      if (dt2.goal == null) dt2.goal = parseInt(WT.el.goal.value, 10) || 0;
      WT.saveMonth(y, m, dt2); refreshEntries(); WT.renderStats();
    }

    WT.activeFoodLog = {
      add: function (name, protein) { rec.foods.push({ name: name, p: protein }); save(); }
    };

    addBtn.addEventListener('click', WT.openFoodModal);
    refreshEntries();
    panel.appendChild(wrap);
  };

  WT.attachDayPanel = function (panel, y, m, d, snap) {
    var id = WT.iso(y, m, d), md = WT.loadMonth(y, m), rec = WT.ensureRec(md, id);
    var gv = md.goal != null ? md.goal : parseInt(WT.el.goal.value, 10) || 0;
    var dow = new Date(y, m, d).getDay(), lines = WT.planLines(snap, dow), dt = WT.dayType(lines, dow);

    var head = document.createElement('div'); head.className = 'day-head';
    head.textContent = WT.DOW_LABEL[dow] + ' ' + d;
    var badge = document.createElement('span'); badge.className = 'day-type-badge';
    badge.textContent = dt.label; badge.style.color = dt.color; badge.style.background = dt.bg;
    head.appendChild(badge); panel.appendChild(head);

    var tracking = document.createElement('div'); tracking.className = 'day-tracking';
    tracking.appendChild(WT.makeCheck('Lift', 'tag-lift', !!rec.lift, id, y, m, id, 'lift'));
    tracking.appendChild(WT.makeCheck('Run', 'tag-run', !!rec.run, id, y, m, id, 'run'));
    panel.appendChild(tracking);

    WT.buildFoodLog(panel, y, m, id, gv);

    var sec = document.createElement('div'); sec.className = 'day-plan-section';
    var secTitle = document.createElement('div'); secTitle.className = 'day-plan-title'; secTitle.textContent = "Today's Plan";
    sec.appendChild(secTitle);

    var ul = document.createElement('ul'); ul.className = 'day-plan big';
    lines.forEach(function (l, idx) {
      var li = document.createElement('li'); li.className = WT.lineCategory(l); li.textContent = l;
      ul.appendChild(li);

      var isLift = l.toLowerCase().indexOf('lift:') === 0;
      if (isLift) {
        var cur = rec.lifts[String(idx)] || {};
        var prev = WT.getPrevLift(y, m, d, dow, idx);

        var logRow = document.createElement('div'); logRow.className = 'lift-log';
        var wIn = document.createElement('input'); wIn.type = 'number'; wIn.placeholder = prev ? String(prev.w) : 'lbs';
        wIn.setAttribute('aria-label', 'Weight for ' + l);
        if (cur.w) wIn.value = cur.w;
        var xLbl = document.createElement('span'); xLbl.className = 'lift-log-label'; xLbl.textContent = 'lbs \u00d7';
        var rIn = document.createElement('input'); rIn.type = 'text'; rIn.className = 'reps-input';
        rIn.placeholder = prev ? prev.r : 'reps'; rIn.setAttribute('aria-label', 'Reps for ' + l);
        if (cur.r) rIn.value = cur.r;
        logRow.appendChild(wIn); logRow.appendChild(xLbl); logRow.appendChild(rIn);
        ul.appendChild(logRow);

        if (prev && !cur.w) {
          var hint = document.createElement('div'); hint.className = 'lift-log-prev';
          hint.textContent = 'Last: ' + prev.w + ' lbs \u00d7 ' + prev.r;
          ul.appendChild(hint);
        }

        (function (exIdx, wInput, rInput) {
          function saveLift() {
            var md2 = WT.loadMonth(y, m); WT.ensureRec(md2, id);
            var wv = parseInt(wInput.value, 10), rv = rInput.value.trim();
            if (wv || rv) {
              md2.days[id].lifts[String(exIdx)] = { w: wv || 0, r: rv };
            } else {
              delete md2.days[id].lifts[String(exIdx)];
            }
            WT.saveMonth(y, m, md2);
          }
          wInput.addEventListener('blur', saveLift);
          rInput.addEventListener('blur', saveLift);
        })(idx, wIn, rIn);
      }
    });
    sec.appendChild(ul);
    panel.appendChild(sec);
  };

  WT.renderMonth = function () {
    var fDow = new Date(WT.view.y, WT.view.m, 1).getDay(), ms = (fDow + 6) % 7, dm = WT.dim(WT.view.y, WT.view.m);
    var rows = Math.ceil((ms + dm) / 7), snap = WT.loadPlan();
    var hd = document.createElement('div'); hd.className = 'cal-head';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function (w) { var c = document.createElement('div'); c.textContent = w; hd.appendChild(c); });
    var gr = document.createElement('div');
    for (var r = 0; r < rows; r++) {
      var row = document.createElement('div'); row.className = 'cal-row';
      for (var c = 0; c < 7; c++) {
        var idx = r * 7 + c, dn = idx - ms + 1, cell = document.createElement('div'); cell.className = 'month-cell';
        if (dn < 1 || dn > dm) { cell.classList.add('out'); var gh = new Date(WT.view.y, WT.view.m, dn); cell.innerHTML = '<span class="day-num" style="opacity:.5">' + gh.getDate() + '</span>'; row.appendChild(cell); continue; }
        WT.attachMonthCell(cell, WT.view.y, WT.view.m, dn, snap);
        (function (day) {
          cell.addEventListener('click', function () {
            WT.focus = { y: WT.view.y, m: WT.view.m, d: day }; WT.saveFocus();
            WT.viewMode = 'day'; localStorage.setItem(WT.VIEW_KEY, WT.viewMode);
            document.querySelectorAll('#viewSeg .seg-btn').forEach(function (b) { b.classList.remove('active'); });
            var dayBtn = document.querySelector('#viewSeg .seg-btn[data-view="day"]'); if (dayBtn) dayBtn.classList.add('active');
            WT.render();
          });
        })(dn);
        row.appendChild(cell);
      }
      gr.appendChild(row);
    }
    WT.el.cal.appendChild(hd); WT.el.cal.appendChild(gr);
  };

  WT.renderWeek = function () {
    var snap = WT.loadPlan(), inner = document.createElement('div'); inner.className = 'week-inner';
    var grid = document.createElement('div'); grid.className = 'week-grid';
    var mn = WT.monOf(WT.focus.y, WT.focus.m, WT.focus.d);
    for (var i = 0; i < 7; i++) {
      var fd = WT.addD(mn.y, mn.m, mn.d, i), col = document.createElement('div'); col.className = 'week-card';
      WT.attachWeekCard(col, fd.y, fd.m, fd.d, snap); grid.appendChild(col);
    }
    inner.appendChild(grid); WT.el.cal.appendChild(inner);
  };

  WT.renderDay = function () {
    var snap = WT.loadPlan(), inner = document.createElement('div'); inner.className = 'day-inner';
    var panel = document.createElement('div'); panel.className = 'day-panel';
    WT.attachDayPanel(panel, WT.focus.y, WT.focus.m, WT.focus.d, snap);
    inner.appendChild(panel); WT.el.cal.appendChild(inner);
  };

  WT.render = function () {
    WT.syncGoal(); WT.el.printGoal.textContent = WT.el.goal.value; WT.updateTitle(); WT.renderStats();
    WT.el.cal.innerHTML = '';
    if (WT.viewMode === 'month') WT.renderMonth(); else if (WT.viewMode === 'week') WT.renderWeek(); else WT.renderDay();
  };
})();
