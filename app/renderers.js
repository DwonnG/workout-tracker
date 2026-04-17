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

  WT.renderHistory = function () {
    var inner = document.createElement('div'); inner.className = 'history-inner';
    var snap = WT.loadPlan();
    var sessions = [];
    for (var mo = 0; mo >= -3; mo--) {
      var dt = new Date(WT.focus.y, WT.focus.m + mo, 1);
      var y = dt.getFullYear(), m = dt.getMonth();
      var md = WT.loadMonth(y, m);
      var dKeys = Object.keys(md.days || {}).sort().reverse();
      for (var i = 0; i < dKeys.length; i++) {
        var r = md.days[dKeys[i]];
        if (!r) continue;
        var hasActivity = r.lift || r.run || (r.lifts && Object.keys(r.lifts).length > 0);
        if (!hasActivity) continue;
        var parts = dKeys[i].split('-');
        sessions.push({ id: dKeys[i], y: parseInt(parts[0], 10), m: parseInt(parts[1], 10) - 1, d: parseInt(parts[2], 10), rec: r });
      }
    }
    sessions.sort(function (a, b) { return b.id < a.id ? -1 : b.id > a.id ? 1 : 0; });

    if (!sessions.length) {
      inner.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:2rem;font:.85rem/1.4 \'Inter\',sans-serif">No workout sessions yet. Start logging!</div>';
      WT.el.cal.appendChild(inner);
      return;
    }

    sessions.forEach(function (sess) {
      var card = document.createElement('div'); card.className = 'history-card';
      var dow = new Date(sess.y, sess.m, sess.d).getDay();
      var dtObj = WT.dayType(WT.planLines(snap, dow), dow);

      var hdr = document.createElement('div'); hdr.className = 'history-card-header';
      var dateLbl = document.createElement('span'); dateLbl.className = 'history-date';
      dateLbl.textContent = WT.DOW_SHORT[dow] + ' ' + WT.MONTH_SHORT[sess.m] + ' ' + sess.d;
      var badge = document.createElement('span'); badge.className = 'history-badge';
      badge.textContent = dtObj.label; badge.style.color = dtObj.color; badge.style.background = dtObj.bg;
      hdr.appendChild(dateLbl); hdr.appendChild(badge);

      var dur = WT.workoutDuration(sess.rec);
      if (dur != null && sess.rec.finishedAt) {
        var durEl = document.createElement('span'); durEl.className = 'history-dur';
        durEl.textContent = WT.formatDuration(dur);
        hdr.appendChild(durEl);
      }
      card.appendChild(hdr);

      if (sess.rec.lifts) {
        var liftKeys = Object.keys(sess.rec.lifts);
        if (liftKeys.length) {
          var liftList = document.createElement('div'); liftList.className = 'history-lifts';
          for (var j = 0; j < liftKeys.length; j++) {
            var ld = WT.migrateLift(sess.rec.lifts[liftKeys[j]]);
            if (!ld.sets || !ld.sets.length) continue;
            var vol = WT.liftVolume(ld);
            var bestW = 0, bestR = 0;
            for (var k = 0; k < ld.sets.length; k++) {
              if (ld.sets[k].done && ld.sets[k].w > bestW) { bestW = ld.sets[k].w; bestR = ld.sets[k].r; }
            }
            if (bestW > 0) {
              var row = document.createElement('div'); row.className = 'history-lift-row';
              row.innerHTML = '<span class="history-lift-best">' + bestW + '\u00d7' + bestR + '</span>' +
                (vol > 0 ? '<span class="history-lift-vol">' + vol.toLocaleString() + ' lbs vol</span>' : '');
              liftList.appendChild(row);
            }
          }
          card.appendChild(liftList);
        }
      }

      card.addEventListener('click', function () {
        WT.focus = { y: sess.y, m: sess.m, d: sess.d }; WT.saveFocus();
        WT.viewMode = 'day'; localStorage.setItem(WT.VIEW_KEY, WT.viewMode);
        if (WT.syncNav) WT.syncNav();
        WT.render();
      });

      inner.appendChild(card);
    });
    WT.el.cal.appendChild(inner);
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
    else if (WT.viewMode === 'history') WT.renderHistory();
    else WT.renderDay();
  };
})();
