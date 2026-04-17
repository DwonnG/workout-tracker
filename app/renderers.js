(function () {
  var WT = window.WT;

  WT.attachMonthCell = function (cell, y, m, d, snap) {
    var id = WT.iso(y, m, d), md = WT.loadMonth(y, m), rec = WT.ensureRec(md, id);
    var n = new Date(); if (n.getFullYear() === y && n.getMonth() === m && n.getDate() === d) cell.classList.add('today');
    var dow = new Date(y, m, d).getDay(), lines = WT.planLines(snap, dow), dt = WT.dayType(lines, dow);

    var nutritionHit = true, hasAnyGoal = false;
    WT.trackedMacros.forEach(function (k) {
      var goalVal = WT.getGoal(md, k);
      if (goalVal <= 0) return;
      hasAnyGoal = true;
      var val = 0;
      if (k === 'p') { val = parseInt(rec.p, 10) || 0; }
      else if (rec.totals && rec.totals[k] != null) { val = rec.totals[k]; }
      if (val < goalVal) nutritionHit = false;
    });
    if (!hasAnyGoal) {
      var pv = parseInt(rec.p, 10) || 0;
      nutritionHit = pv > 0;
    }

    var top = document.createElement('div'); top.className = 'mc-top';
    var num = document.createElement('span'); num.className = 'day-num'; num.textContent = String(d);
    var dots = document.createElement('div'); dots.className = 'mc-dots';
    dots.innerHTML = '<span class="dot dot-lift' + (rec.lift ? ' on' : '') + '"></span><span class="dot dot-run' + (rec.run ? ' on' : '') + '"></span><span class="dot dot-protein' + (nutritionHit ? ' on' : '') + '"></span>';
    top.appendChild(num); top.appendChild(dots); cell.appendChild(top);

    var lb = document.createElement('div'); lb.className = 'mc-label'; lb.textContent = dt.label;
    lb.style.color = dt.color; cell.appendChild(lb);
  };

  WT.attachWeekCard = function (card, y, m, d, snap) {
    var id = WT.iso(y, m, d), md = WT.loadMonth(y, m), rec = WT.ensureRec(md, id);
    var n = new Date(); if (n.getFullYear() === y && n.getMonth() === m && n.getDate() === d) card.classList.add('today');
    var dow = new Date(y, m, d).getDay(), lines = WT.planLines(snap, dow), dt = WT.dayType(lines, dow);

    var header = document.createElement('div'); header.className = 'wc-header';
    var sub = document.createElement('div'); sub.className = 'week-sub'; sub.textContent = WT.DOW_SHORT[dow] + ' ' + d;
    var badge = document.createElement('span'); badge.className = 'wc-type'; badge.textContent = dt.label;
    badge.style.color = dt.color; badge.style.background = dt.bg;
    header.appendChild(sub); header.appendChild(badge); card.appendChild(header);

    var tracking = document.createElement('div'); tracking.className = 'wc-tracking';
    var wcHasRun = lines.some(function (l) { return l.toLowerCase().replace(/^ss:\s*/, '').indexOf('run:') === 0; });
    if (wcHasRun) tracking.appendChild(WT.makeCheck('Run', 'tag-run', !!rec.run, id, y, m, id, 'run'));

    WT.trackedMacros.forEach(function (key) {
      var mac = WT.MACROS[key];
      var goalVal = WT.getGoal(md, key);
      var pr = document.createElement('div'); pr.className = 'row-inline';
      var pl = document.createElement('span'); pl.className = 'plabel'; pl.textContent = mac.abbr;
      pl.style.color = mac.color; pl.style.background = mac.color.indexOf('var(') === 0 ? 'rgba(255,255,255,0.06)' : mac.color + '18';
      pr.appendChild(pl);
      var pi = document.createElement('input'); pi.type = 'number'; pi.min = '0';
      pi.max = key === 'sodium' ? '10000' : (key === 'cal' ? '10000' : '1000');
      pi.step = '1'; pi.placeholder = mac.unit || '';

      var currentVal;
      if (key === 'p') {
        currentVal = rec.p;
      } else {
        currentVal = (rec.totals && rec.totals[key] != null) ? rec.totals[key] : '';
      }
      pi.value = (currentVal === '' || currentVal == null) ? '' : String(currentVal);
      pi.setAttribute('aria-label', mac.label + ' ' + id);

      var st = document.createElement('span'); st.className = 'hit';
      function upd() {
        var v = parseInt(pi.value, 10);
        if (isNaN(v) || pi.value === '') { st.textContent = ''; st.className = 'hit'; return; }
        if (v >= goalVal && goalVal > 0) { st.textContent = '\u2713'; st.className = 'hit'; }
        else if (goalVal > 0) { st.textContent = '\u2014'; st.className = 'miss'; }
        else st.textContent = '';
      }
      upd();
      pi.addEventListener('input', (function (mk) {
        return function () {
          var dt2 = WT.loadMonth(y, m); WT.ensureRec(dt2, id);
          if (mk === 'p') {
            dt2.days[id].p = pi.value;
          } else {
            if (!dt2.days[id].totals) dt2.days[id].totals = {};
            dt2.days[id].totals[mk] = parseInt(pi.value, 10) || 0;
          }
          WT.saveMonth(y, m, dt2); upd(); WT.renderStats();
        };
      })(key));
      pr.appendChild(pi); pr.appendChild(st); tracking.appendChild(pr);
    });
    card.appendChild(tracking);

    var planDiv = document.createElement('div'); planDiv.className = 'wc-plan';
    planDiv.appendChild(WT.buildPlanList(snap, dow, ''));
    card.appendChild(planDiv);

    var expandBtn = document.createElement('button'); expandBtn.className = 'wc-expand-btn';
    expandBtn.textContent = 'Log sets \u25be';
    var expanded = false;
    var expandPanel = document.createElement('div'); expandPanel.className = 'wc-expand-panel';
    expandPanel.style.display = 'none';

    expandBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      expanded = !expanded;
      if (expanded) {
        expandPanel.innerHTML = '';
        var miniPanel = document.createElement('div'); miniPanel.className = 'day-panel mini-day';
        WT.attachDayPanel(miniPanel, y, m, d, snap);
        expandPanel.appendChild(miniPanel);
        expandPanel.style.display = '';
        expandBtn.textContent = 'Hide \u25b4';
      } else {
        expandPanel.style.display = 'none';
        expandBtn.textContent = 'Log sets \u25be';
      }
    });
    card.appendChild(expandBtn);
    card.appendChild(expandPanel);
  };

  WT.buildFoodLog = function (panel, y, m, id) {
    var md = WT.loadMonth(y, m), rec = WT.ensureRec(md, id);

    var wrap = document.createElement('div'); wrap.className = 'food-log';
    var header = document.createElement('div'); header.className = 'food-log-header';
    var title = document.createElement('span'); title.className = 'food-log-title'; title.textContent = 'Nutrition Log';
    var addBtn = document.createElement('button'); addBtn.className = 'food-add-btn';
    addBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Food';
    header.appendChild(title); header.appendChild(addBtn);
    wrap.appendChild(header);

    var entriesDiv = document.createElement('div'); entriesDiv.className = 'food-entries';
    var totalsDiv = document.createElement('div'); totalsDiv.className = 'food-totals';
    wrap.appendChild(entriesDiv);
    wrap.appendChild(totalsDiv);

    function calcTotals() {
      var sums = {};
      WT.MACRO_ORDER.forEach(function (k) { sums[k] = 0; });
      rec.foods.forEach(function (f) {
        WT.MACRO_ORDER.forEach(function (k) { sums[k] += WT.macroVal(f, k); });
      });
      return sums;
    }

    function refreshEntries() {
      entriesDiv.innerHTML = '';
      if (!rec.foods.length) {
        var empty = document.createElement('div'); empty.className = 'food-empty'; empty.textContent = 'No foods logged yet \u2014 tap Add Food to start';
        entriesDiv.appendChild(empty);
      }
      rec.foods.forEach(function (f, i) {
        var row = document.createElement('div'); row.className = 'food-entry';
        var nm = document.createElement('span'); nm.className = 'food-entry-name'; nm.textContent = f.name;
        var pills = document.createElement('span'); pills.className = 'macro-pills';
        WT.trackedMacros.forEach(function (k) {
          var mac = WT.MACROS[k];
          var pill = document.createElement('span'); pill.className = 'macro-pill';
          pill.style.color = mac.color;
          pill.textContent = mac.abbr + ' ' + WT.macroVal(f, k) + (mac.unit || '');
          pills.appendChild(pill);
        });
        var del = document.createElement('button'); del.className = 'food-entry-del'; del.textContent = '\u00d7';
        del.setAttribute('aria-label', 'Remove ' + f.name);
        del.addEventListener('click', function () { rec.foods.splice(i, 1); save(); });
        row.appendChild(nm); row.appendChild(pills); row.appendChild(del);
        entriesDiv.appendChild(row);
      });
      refreshTotals();
    }

    function refreshTotals() {
      var sums = calcTotals();
      totalsDiv.innerHTML = '';
      WT.trackedMacros.forEach(function (k) {
        var mac = WT.MACROS[k];
        var goalVal = WT.getGoal(md, k);
        var sum = sums[k];
        var pct = goalVal > 0 ? Math.min(100, Math.round(sum / goalVal * 100)) : 0;

        var row = document.createElement('div'); row.className = 'food-total-row';
        var lbl = document.createElement('span'); lbl.className = 'food-total-label'; lbl.textContent = mac.label; lbl.style.color = mac.color;
        var num = document.createElement('span'); num.className = 'food-total-num'; num.textContent = sum + (mac.unit || ''); num.style.color = mac.color;
        var bar = document.createElement('div'); bar.className = 'food-total-bar';
        var fill = document.createElement('div'); fill.className = 'food-total-fill';
        fill.style.width = pct + '%';
        fill.style.background = (sum >= goalVal && goalVal > 0) ? mac.color : 'var(--text-muted)';
        bar.appendChild(fill);
        var goalSpan = document.createElement('span'); goalSpan.className = 'food-total-goal';
        goalSpan.textContent = goalVal > 0 ? (pct + '% of ' + goalVal + (mac.unit || '')) : 'no goal';
        row.appendChild(lbl); row.appendChild(num); row.appendChild(bar); row.appendChild(goalSpan);
        totalsDiv.appendChild(row);
      });
    }

    function save() {
      var dt2 = WT.loadMonth(y, m); WT.ensureRec(dt2, id);
      dt2.days[id].foods = rec.foods;
      var sums = calcTotals();
      dt2.days[id].p = String(Math.max(sums.p, parseInt(dt2.days[id].p, 10) || 0));
      if (!dt2.days[id].totals) dt2.days[id].totals = {};
      WT.MACRO_ORDER.forEach(function (k) { dt2.days[id].totals[k] = sums[k]; });
      WT.saveMonth(y, m, dt2); refreshEntries(); WT.renderStats();
    }

    WT.activeFoodLog = {
      add: function (name, macros) {
        var entry = { name: name };
        WT.MACRO_ORDER.forEach(function (k) { entry[k] = (macros && macros[k]) || 0; });
        rec.foods.push(entry);
        save();
      }
    };

    addBtn.addEventListener('click', WT.openFoodModal);
    refreshEntries();
    panel.appendChild(wrap);
  };

  WT.attachDayPanel = function (panel, y, m, d, snap) {
    var id = WT.iso(y, m, d), md = WT.loadMonth(y, m), rec = WT.ensureRec(md, id);
    var dow = new Date(y, m, d).getDay(), lines = WT.planLines(snap, dow), dt = WT.dayType(lines, dow);

    var head = document.createElement('div'); head.className = 'day-head';
    head.textContent = WT.DOW_LABEL[dow] + ' ' + d;
    var badge = document.createElement('span'); badge.className = 'day-type-badge';
    badge.textContent = dt.label; badge.style.color = dt.color; badge.style.background = dt.bg;
    head.appendChild(badge);

    var dur = WT.workoutDuration(rec);
    if (dur != null) {
      var durBadge = document.createElement('span'); durBadge.className = 'day-duration-badge';
      durBadge.textContent = WT.formatDuration(dur);
      head.appendChild(durBadge);
    }
    panel.appendChild(head);

    var hasRunPlan = lines.some(function (l) { return l.toLowerCase().replace(/^ss:\s*/, '').indexOf('run:') === 0; });
    if (hasRunPlan) {
      var tracking = document.createElement('div'); tracking.className = 'day-tracking';
      tracking.appendChild(WT.makeCheck('Run', 'tag-run', !!rec.run, id, y, m, id, 'run'));
      panel.appendChild(tracking);
    }

    WT.buildFoodLog(panel, y, m, id);

    var warmLines = [], mainLines = [], coolLines = [];
    for (var li = 0; li < lines.length; li++) {
      var cat = WT.lineCategory(lines[li]);
      if (cat === 'li-warmup') warmLines.push({ line: lines[li], idx: li });
      else if (cat === 'li-cooldown') coolLines.push({ line: lines[li], idx: li });
      else mainLines.push({ line: lines[li], idx: li });
    }

    function buildLiftBlock(container, l, idx) {
      var isLift = l.toLowerCase().replace(/^ss:\s*/i, '').indexOf('lift:') === 0;
      if (!isLift) return;
      var cur = rec.lifts[String(idx)] || WT.defaultSets(l);
      if (!cur.sets) cur = WT.migrateLift(cur);
      if (!cur.sets.length) cur = WT.defaultSets(l);
      var prev = WT.getPrevLift(y, m, d, dow, idx);

      var setWrap = document.createElement('div'); setWrap.className = 'set-table';
      var hdr = document.createElement('div'); hdr.className = 'set-row set-header';
      hdr.innerHTML = '<span class="set-num-col">Set</span><span class="set-w-col">lbs</span><span class="set-r-col">Reps</span><span class="set-done-col"></span><span class="set-del-col"></span>';
      setWrap.appendChild(hdr);

      var setBody = document.createElement('div'); setBody.className = 'set-body';
      setWrap.appendChild(setBody);

      var prShown = false;

      function saveSets() {
        var md2 = WT.loadMonth(y, m); WT.ensureRec(md2, id);
        var hasData = cur.sets.some(function (s) { return s.w > 0 || s.r > 0 || s.done; });
        if (hasData) { md2.days[id].lifts[String(idx)] = { sets: cur.sets }; }
        else { delete md2.days[id].lifts[String(idx)]; }
        var anyLiftDone = Object.keys(md2.days[id].lifts).some(function (k) {
          var ld = md2.days[id].lifts[k];
          return ld && ld.sets && ld.sets.some(function (s) { return s.done; });
        });
        md2.days[id].lift = anyLiftDone;
        WT.saveMonth(y, m, md2); WT.renderStats();
        if (!prShown && WT.checkPR && WT.checkPR(cur, l, y, m, d)) {
          prShown = true;
          WT.showToast('PR! New personal record!', 'var(--accent)');
          if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        }
      }

      function renderSets() {
        setBody.innerHTML = '';
        cur.sets.forEach(function (s, si) {
          var row = document.createElement('div');
          row.className = 'set-row' + (s.done ? ' done' : '') + (s.type === 'warmup' ? ' warmup' : '');
          var numBtn = document.createElement('button'); numBtn.className = 'set-num-col set-type-btn';
          var st = WT.SET_TYPES[s.type] || WT.SET_TYPES.work;
          numBtn.textContent = st.label + (si + 1); numBtn.style.color = st.color; numBtn.title = st.long + ' set';
          numBtn.addEventListener('click', function () {
            var ci = WT.SET_TYPE_ORDER.indexOf(s.type);
            s.type = WT.SET_TYPE_ORDER[(ci + 1) % WT.SET_TYPE_ORDER.length];
            saveSets(); renderSets();
          });
          var prevSet = prev && prev.sets && prev.sets[si];
          var wIn = document.createElement('input'); wIn.type = 'number'; wIn.className = 'set-w-col';
          wIn.value = s.w ? String(s.w) : ''; wIn.placeholder = prevSet && prevSet.w ? String(prevSet.w) : '';
          wIn.setAttribute('aria-label', 'Weight set ' + (si + 1));
          wIn.addEventListener('change', function () { s.w = parseInt(wIn.value, 10) || 0; saveSets(); });
          var rIn = document.createElement('input'); rIn.type = 'number'; rIn.className = 'set-r-col';
          rIn.value = s.r ? String(s.r) : ''; rIn.placeholder = prevSet && prevSet.r ? String(prevSet.r) : '';
          rIn.setAttribute('aria-label', 'Reps set ' + (si + 1));
          rIn.addEventListener('change', function () { s.r = parseInt(rIn.value, 10) || 0; saveSets(); });
          var doneBtn = document.createElement('button'); doneBtn.className = 'set-done-col set-done-btn' + (s.done ? ' checked' : '');
          doneBtn.innerHTML = s.done ? '\u2713' : '';
          doneBtn.setAttribute('aria-label', 'Mark set ' + (si + 1) + ' done');
          doneBtn.addEventListener('click', function () {
            s.done = !s.done;
            if (s.done && !s.w && wIn.value) s.w = parseInt(wIn.value, 10) || 0;
            if (s.done && !s.r && rIn.value) s.r = parseInt(rIn.value, 10) || 0;
            saveSets(); renderSets();
            if (s.done) {
              WT.stampStart(y, m, id);
              if (WT.startRestTimer) WT.startRestTimer(s.type);
              WT.haptic('medium');
            } else {
              WT.haptic('light');
            }
          });
          var delBtn = document.createElement('button'); delBtn.className = 'set-del-col set-del-btn';
          delBtn.textContent = '\u00d7'; delBtn.setAttribute('aria-label', 'Remove set ' + (si + 1));
          delBtn.addEventListener('click', function () { cur.sets.splice(si, 1); saveSets(); renderSets(); });
          row.appendChild(numBtn); row.appendChild(wIn); row.appendChild(rIn);
          row.appendChild(doneBtn); row.appendChild(delBtn);
          setBody.appendChild(row);
        });
        var vol = WT.liftVolume(cur);
        if (vol > 0) {
          var volRow = document.createElement('div'); volRow.className = 'set-volume';
          volRow.textContent = 'Vol: ' + vol.toLocaleString() + ' lbs';
          setBody.appendChild(volRow);
        }
      }

      var addBtn = document.createElement('button'); addBtn.className = 'set-add-btn';
      addBtn.textContent = '+ Add Set';
      addBtn.addEventListener('click', function () {
        var last = cur.sets.length ? cur.sets[cur.sets.length - 1] : null;
        cur.sets.push({ w: last ? last.w : 0, r: last ? last.r : 0, done: false, type: 'work' });
        saveSets(); renderSets();
      });
      setWrap.appendChild(addBtn);

      if (prev && prev.sets && prev.sets.length && !cur.sets.some(function (s) { return s.done; })) {
        var hint = document.createElement('div'); hint.className = 'lift-log-prev';
        var parts = prev.sets.map(function (ps) { return ps.w + '\u00d7' + ps.r; });
        hint.textContent = 'Last: ' + parts.join(', ');
        setWrap.appendChild(hint);
      }

      renderSets();
      container.appendChild(setWrap);
    }

    function buildLineItem(container, l, idx) {
      var displayText = WT.isSupersetLine(l) ? WT.stripSS(l) : l;
      var li = document.createElement('li'); li.className = WT.lineCategory(l); li.textContent = WT.titleCase(displayText);
      container.appendChild(li);

      var checkLift = displayText.toLowerCase().indexOf('lift:') === 0;
      if (checkLift) {
        li.style.cursor = 'pointer';
        (function (planLine) {
          li.addEventListener('click', function () { if (WT.openChart) WT.openChart(planLine, y, m, d); });
        })(displayText);
      }

      buildLiftBlock(container, displayText, idx);
    }

    function addExerciseBtn(sectionPrefix) {
      var btn = document.createElement('button');
      btn.className = 'plan-add-exercise-btn';
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Exercise';
      btn.addEventListener('click', function () {
        if (!WT.initExercisePicker) return;
        var pickerModal = document.getElementById('exercisePickerModal');
        if (!pickerModal) return;
        WT.openDayPicker(function (line) {
          var finalLine = sectionPrefix ? line.replace(/^[^:]+:\s*/, sectionPrefix) : line;
          lines.push(finalLine);
          var p = WT.loadPlan();
          if (!p[dow]) p[dow] = [];
          p[dow].push(finalLine);
          WT.savePlan(p);
          WT.render();
        });
      });
      return btn;
    }

    function renderLineGroup(items) {
      var ul = document.createElement('ul'); ul.className = 'day-plan big';
      items.forEach(function (item) { buildLineItem(ul, item.line, item.idx); });
      return ul;
    }

    var warmSec = document.createElement('div'); warmSec.className = 'day-plan-section day-section-warmup';
    var warmTitle = document.createElement('div'); warmTitle.className = 'day-plan-title day-plan-title-warmup'; warmTitle.textContent = 'Warm Up';
    warmSec.appendChild(warmTitle);
    if (warmLines.length) warmSec.appendChild(renderLineGroup(warmLines));
    warmSec.appendChild(addExerciseBtn('Warm Up: '));
    panel.appendChild(warmSec);

    var sec = document.createElement('div'); sec.className = 'day-plan-section';
    var secTitle = document.createElement('div'); secTitle.className = 'day-plan-title'; secTitle.textContent = "Today's Plan";
    sec.appendChild(secTitle);
    var mainUl = document.createElement('ul'); mainUl.className = 'day-plan big';
    var mainLinesOnly = mainLines.map(function (item) { return item.line; });
    var groups = WT.groupSupersets(mainLinesOnly);
    var idxMap = mainLines.map(function (item) { return item.idx; });
    groups.forEach(function (g) {
      if (g.type === 'superset') {
        var ssWrap = document.createElement('div'); ssWrap.className = 'superset-group';
        var ssLabel = document.createElement('div'); ssLabel.className = 'superset-label'; ssLabel.textContent = 'Superset';
        ssWrap.appendChild(ssLabel);
        var ssInner = document.createElement('div'); ssInner.className = 'superset-inner';
        g.items.forEach(function (item) { buildLineItem(ssInner, item.line, idxMap[item.idx] != null ? idxMap[item.idx] : item.idx); });
        ssWrap.appendChild(ssInner);
        mainUl.appendChild(ssWrap);
      } else {
        buildLineItem(mainUl, g.line, idxMap[g.idx] != null ? idxMap[g.idx] : g.idx);
      }
    });
    sec.appendChild(mainUl);
    sec.appendChild(addExerciseBtn());
    panel.appendChild(sec);

    var coolSec = document.createElement('div'); coolSec.className = 'day-plan-section day-section-cooldown';
    var coolTitle = document.createElement('div'); coolTitle.className = 'day-plan-title day-plan-title-cooldown'; coolTitle.textContent = 'Cool Down';
    coolSec.appendChild(coolTitle);
    if (coolLines.length) coolSec.appendChild(renderLineGroup(coolLines));
    coolSec.appendChild(addExerciseBtn('Cool Down: '));
    panel.appendChild(coolSec);

    if (rec.startedAt && !rec.finishedAt) {
      var finBtn = document.createElement('button'); finBtn.className = 'btn btn-finish-workout';
      finBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Finish Workout';
      finBtn.addEventListener('click', function () {
        WT.stampFinish(y, m, id);
        WT.render();
        WT.showToast('Workout finished! ' + WT.formatDuration(WT.workoutDuration(WT.loadMonth(y, m).days[id])), 'var(--green)');
      });
      panel.appendChild(finBtn);
    } else if (rec.finishedAt) {
      var doneBadge = document.createElement('div'); doneBadge.className = 'workout-complete-badge';
      doneBadge.textContent = 'Workout complete \u2014 ' + WT.formatDuration(dur);
      panel.appendChild(doneBadge);
    }
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
            if (WT.syncNav) WT.syncNav();
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

  WT.renderProgress = function () {
    var wrap = document.createElement('div'); wrap.className = 'progress-wrap';
    var deferredCharts = [];

    var summary = WT.progressSummary();
    var summaryRow = document.createElement('div'); summaryRow.className = 'progress-summary';

    function statCard(label, value, unit, delta) {
      var card = document.createElement('div'); card.className = 'progress-stat';
      var valEl = document.createElement('div'); valEl.className = 'progress-stat-val';
      valEl.textContent = value != null ? (typeof value === 'number' ? value.toLocaleString() : value) : '--';
      if (unit) { var u = document.createElement('span'); u.className = 'progress-stat-unit'; u.textContent = ' ' + unit; valEl.appendChild(u); }
      card.appendChild(valEl);
      var lbl = document.createElement('div'); lbl.className = 'progress-stat-label'; lbl.textContent = label;
      card.appendChild(lbl);
      if (delta != null && delta !== 0) {
        var dEl = document.createElement('div');
        dEl.className = 'progress-stat-delta ' + (delta > 0 ? 'up' : 'down');
        dEl.textContent = (delta > 0 ? '\u25B2 +' : '\u25BC ') + Math.abs(delta).toLocaleString();
        card.appendChild(dEl);
      }
      return card;
    }

    summaryRow.appendChild(statCard('Workouts', summary.workouts, '', summary.workoutsDelta));
    summaryRow.appendChild(statCard('Volume', summary.avgVolume > 0 ? summary.avgVolume : null, 'lbs', summary.volumeDelta));
    var primaryMacro = WT.MACROS[(WT.trackedMacros || ['p'])[0]] || WT.MACROS.p;
    summaryRow.appendChild(statCard('Avg ' + primaryMacro.label, summary.avgProtein > 0 ? summary.avgProtein : null, primaryMacro.unit || '', null));
    summaryRow.appendChild(statCard('Weight', summary.bodyWeight, summary.bodyWeight ? 'lbs' : '', null));
    wrap.appendChild(summaryRow);

    /* --- Lift Progress card --- */
    var liftCard = document.createElement('div'); liftCard.className = 'progress-card';
    var liftHdr = document.createElement('div'); liftHdr.className = 'progress-card-title'; liftHdr.textContent = 'Lift Progress';
    liftCard.appendChild(liftHdr);

    var exercises = WT.loggedExercises();
    var exNames = Object.keys(exercises).sort(function (a, b) { return exercises[b].count - exercises[a].count; });

    if (exNames.length === 0) {
      var noData = document.createElement('div'); noData.className = 'progress-empty';
      noData.textContent = 'Log some lifts to see trends here.';
      liftCard.appendChild(noData);
    } else {
      var groups = {};
      for (var ei = 0; ei < exNames.length; ei++) {
        var g = exercises[exNames[ei]].group || 'Other';
        if (!groups[g]) groups[g] = [];
        groups[g].push(exNames[ei]);
      }
      var groupNames = Object.keys(groups);
      var activeGroup = groupNames[0];

      var chipRow = document.createElement('div'); chipRow.className = 'progress-chips';
      var chipBtns = {};
      for (var gi = 0; gi < groupNames.length; gi++) {
        var chip = document.createElement('button'); chip.className = 'progress-chip';
        chip.textContent = groupNames[gi];
        chip.dataset.group = groupNames[gi];
        if (gi === 0) chip.classList.add('active');
        chipRow.appendChild(chip);
        chipBtns[groupNames[gi]] = chip;
      }
      liftCard.appendChild(chipRow);

      var select = document.createElement('select'); select.className = 'progress-select';
      liftCard.appendChild(select);

      var liftCanvas = document.createElement('canvas'); liftCanvas.className = 'progress-canvas';
      liftCard.appendChild(liftCanvas);
      var liftMeta = document.createElement('div'); liftMeta.className = 'progress-lift-meta';
      liftCard.appendChild(liftMeta);

      function populateSelect(groupName) {
        select.innerHTML = '';
        var items = groups[groupName] || [];
        for (var si = 0; si < items.length; si++) {
          var opt = document.createElement('option'); opt.value = items[si]; opt.textContent = items[si];
          select.appendChild(opt);
        }
      }

      function renderLiftChart(name) {
        var trend = WT.exerciseTrend(name);
        var weights = [], lbls = [];
        var pr = 0, sessions = trend.length;
        for (var t = 0; t < trend.length; t++) {
          weights.push(trend[t].weight);
          lbls.push(trend[t].date.slice(5));
          if (trend[t].weight > pr) pr = trend[t].weight;
        }
        WT.drawLineChart(liftCanvas, weights, { labels: lbls, color: 'var(--accent)', height: 160 });
        liftMeta.innerHTML = '';
        if (pr > 0) {
          liftMeta.innerHTML = '<span class="progress-pr">PR: ' + pr + ' lbs</span><span class="progress-sessions">Sessions: ' + sessions + '</span>';
        }
      }

      function switchGroup(groupName) {
        activeGroup = groupName;
        for (var k in chipBtns) chipBtns[k].classList.toggle('active', k === groupName);
        populateSelect(groupName);
        if (select.options.length > 0) renderLiftChart(select.value);
      }

      chipRow.addEventListener('click', function (e) {
        var btn = e.target.closest('.progress-chip');
        if (btn && btn.dataset.group) switchGroup(btn.dataset.group);
      });
      select.addEventListener('change', function () { renderLiftChart(select.value); });

      populateSelect(activeGroup);
      deferredCharts.push(function () {
        if (select.options.length > 0) renderLiftChart(select.value);
      });
    }
    wrap.appendChild(liftCard);

    /* --- Body Metrics card --- */
    var metricsData = WT.bodyMetricsTrend(3);
    if (metricsData.length > 0) {
      var metricsCard = document.createElement('div'); metricsCard.className = 'progress-card';
      var metricsHdr = document.createElement('div'); metricsHdr.className = 'progress-card-title'; metricsHdr.textContent = 'Body Metrics';
      metricsCard.appendChild(metricsHdr);

      var weightData = [], fatData = [], mLabels = [];
      var hasWeight = false, hasFat = false;
      for (var bm = 0; bm < metricsData.length; bm++) {
        mLabels.push(metricsData[bm].date.slice(5));
        if (metricsData[bm].weight != null) { weightData.push(metricsData[bm].weight); hasWeight = true; }
        else weightData.push(null);
        if (metricsData[bm].fat != null) { fatData.push(metricsData[bm].fat); hasFat = true; }
        else fatData.push(null);
      }

      if (hasWeight) {
        var wLbl = document.createElement('div'); wLbl.className = 'progress-chart-label'; wLbl.textContent = 'Weight (lbs)';
        metricsCard.appendChild(wLbl);
        var wCanvas = document.createElement('canvas'); wCanvas.className = 'progress-canvas';
        metricsCard.appendChild(wCanvas);
        var cleanW = weightData.filter(function (v) { return v != null; });
        var cleanWL = mLabels.filter(function (_, i) { return weightData[i] != null; });
        (function (c, d, l) { deferredCharts.push(function () { WT.drawLineChart(c, d, { labels: l, color: 'var(--blue)', height: 130 }); }); })(wCanvas, cleanW, cleanWL);
      }

      if (hasFat) {
        var fLbl = document.createElement('div'); fLbl.className = 'progress-chart-label'; fLbl.textContent = 'Body Fat (%)';
        metricsCard.appendChild(fLbl);
        var fCanvas = document.createElement('canvas'); fCanvas.className = 'progress-canvas';
        metricsCard.appendChild(fCanvas);
        var cleanF = fatData.filter(function (v) { return v != null; });
        var cleanFL = mLabels.filter(function (_, i) { return fatData[i] != null; });
        (function (c, d, l) { deferredCharts.push(function () { WT.drawLineChart(c, d, { labels: l, color: '#a78bfa', height: 130 }); }); })(fCanvas, cleanF, cleanFL);
      }

      wrap.appendChild(metricsCard);
    }

    /* --- Consistency card --- */
    var grid = WT.consistencyGrid(8);
    var consistCard = document.createElement('div'); consistCard.className = 'progress-card';
    var consistHdr = document.createElement('div'); consistHdr.className = 'progress-card-title'; consistHdr.textContent = 'Workout Consistency';
    consistCard.appendChild(consistHdr);
    var heatCanvas = document.createElement('canvas'); heatCanvas.className = 'progress-heatmap';
    consistCard.appendChild(heatCanvas);
    deferredCharts.push(function () { WT.drawHeatmap(heatCanvas, grid, { color: 'var(--green)' }); });
    var trained = 0; for (var ci = 0; ci < grid.length; ci++) { if (grid[ci] > 0) trained++; }
    var consistMeta = document.createElement('div'); consistMeta.className = 'progress-card-meta';
    consistMeta.textContent = trained + ' of ' + grid.length + ' days active';
    consistCard.appendChild(consistMeta);
    wrap.appendChild(consistCard);

    /* --- Volume Trend card --- */
    var volData = WT.weeklyVolume(8);
    var volCard = document.createElement('div'); volCard.className = 'progress-card';
    var volHdr = document.createElement('div'); volHdr.className = 'progress-card-title'; volHdr.textContent = 'Weekly Volume';
    volCard.appendChild(volHdr);
    var volCanvas = document.createElement('canvas'); volCanvas.className = 'progress-canvas';
    volCard.appendChild(volCanvas);
    deferredCharts.push(function () { WT.drawBarChart(volCanvas, volData.data, { labels: volData.labels, color: 'var(--accent)', height: 140 }); });
    wrap.appendChild(volCard);

    /* --- Nutrition Trend cards (one per tracked macro) --- */
    var trackedMacros = WT.trackedMacros || ['p'];
    var currentMd = WT.loadMonth(WT.focus.y, WT.focus.m);
    for (var mi = 0; mi < trackedMacros.length; mi++) {
      var macroKey = trackedMacros[mi];
      var macroInfo = WT.MACROS[macroKey];
      if (!macroInfo) continue;
      var nutrData = WT.nutritionTrend(28, macroKey);
      var hasNutr = false;
      for (var ni = 0; ni < nutrData.data.length; ni++) { if (nutrData.data[ni] > 0) { hasNutr = true; break; } }
      if (!hasNutr) continue;
      var nutrCard = document.createElement('div'); nutrCard.className = 'progress-card';
      var nutrHdr = document.createElement('div'); nutrHdr.className = 'progress-card-title';
      nutrHdr.textContent = 'Daily ' + macroInfo.label;
      nutrCard.appendChild(nutrHdr);
      var nutrCanvas = document.createElement('canvas'); nutrCanvas.className = 'progress-canvas';
      nutrCard.appendChild(nutrCanvas);
      var macroGoal = WT.getGoal(currentMd, macroKey);
      (function (c, d, o) { deferredCharts.push(function () { WT.drawLineChart(c, d, o); }); })(nutrCanvas, nutrData.data, { labels: nutrData.labels, color: macroInfo.color, height: 140, goalLine: macroGoal > 0 ? macroGoal : null });
      wrap.appendChild(nutrCard);
    }

    WT.el.cal.appendChild(wrap);
    requestAnimationFrame(function () {
      for (var ci = 0; ci < deferredCharts.length; ci++) deferredCharts[ci]();
    });
  };

  WT.render = function () {
    WT.syncGoal();
    var printParts = [];
    WT.trackedMacros.forEach(function (k) {
      var m = WT.MACROS[k], gv = WT.currentGoalValue ? WT.currentGoalValue(k) : 0;
      if (gv) printParts.push(m.label + ': ' + gv + (m.unit || ''));
    });
    WT.el.printGoal.textContent = printParts.join(' | ') || '';
    WT.updateTitle(); WT.renderStats();
    WT.el.cal.innerHTML = '';
    if (WT.viewMode === 'month') WT.renderMonth();
    else if (WT.viewMode === 'week') WT.renderWeek();
    else if (WT.viewMode === 'progress') WT.renderProgress();
    else WT.renderDay();
  };
})();
