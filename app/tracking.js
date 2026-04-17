(function () {
  var WT = window.WT;

  WT.makeCheck = function (label, cls, checked, ariaId, y, m, id, field) {
    var row = document.createElement('div'); row.className = 'check-row';
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = checked;
    cb.setAttribute('aria-label', label + ' ' + ariaId);
    cb.addEventListener('change', function () {
      var dt = WT.loadMonth(y, m); WT.ensureRec(dt, id); dt.days[id][field] = cb.checked;
      WT.saveMonth(y, m, dt); WT.renderStats();
      if (cb.checked) WT.stampStart(y, m, id);
    });
    row.appendChild(cb);
    var tag = document.createElement('span'); tag.className = 'tag ' + cls; tag.textContent = label;
    row.appendChild(tag); return row;
  };

  WT.renderStats = function () {
    var mn = WT.monOf(WT.focus.y, WT.focus.m, WT.focus.d), snap = WT.loadPlan();
    var lifts = 0, liftTotal = 0, runs = 0, runTotal = 0;
    var weekVolume = 0, volumeDays = 0;
    var totalDuration = 0, durationDays = 0;
    var macroSums = {}, macroDays = {};
    WT.MACRO_ORDER.forEach(function (k) { macroSums[k] = 0; macroDays[k] = 0; });

    for (var i = 0; i < 7; i++) {
      var fd = WT.addD(mn.y, mn.m, mn.d, i);
      var md = WT.loadMonth(fd.y, fd.m), id = WT.iso(fd.y, fd.m, fd.d);
      var rec = md.days[id] || {};
      var dow = new Date(fd.y, fd.m, fd.d).getDay();
      var lines = WT.planLines(snap, dow), hasLiftPlan = false, hasRunPlan = false;
      lines.forEach(function (l) { if (l.toLowerCase().indexOf('lift:') === 0) hasLiftPlan = true; if (l.toLowerCase().indexOf('run:') === 0) hasRunPlan = true; });
      if (hasLiftPlan) liftTotal++;
      if (hasRunPlan) runTotal++;
      if (rec.lift) lifts++;
      if (rec.run) runs++;

      if (rec.lifts) {
        var dayVol = 0;
        var lkeys = Object.keys(rec.lifts);
        for (var j = 0; j < lkeys.length; j++) {
          dayVol += WT.liftVolume(WT.migrateLift(rec.lifts[lkeys[j]]));
        }
        if (dayVol > 0) { weekVolume += dayVol; volumeDays++; }
      }

      var durMin = WT.workoutDuration(rec);
      if (durMin != null && rec.finishedAt) { totalDuration += durMin; durationDays++; }

      WT.MACRO_ORDER.forEach(function (k) {
        var val = 0;
        if (k === 'p') {
          val = parseInt(rec.p, 10) || 0;
        } else if (rec.totals && rec.totals[k] != null) {
          val = rec.totals[k];
        }
        if (val > 0) { macroSums[k] += val; macroDays[k]++; }
      });
    }

    var html =
      '<div class="stat-item"><span class="stat-val accent">' + lifts + '/' + (liftTotal || '\u2014') + '</span> lifts</div>' +
      '<div class="stat-item"><span class="stat-val blue">' + runs + '/' + (runTotal || '\u2014') + '</span> runs</div>';

    if (weekVolume > 0) {
      var volStr = weekVolume >= 1000 ? Math.round(weekVolume / 1000) + 'k' : String(weekVolume);
      html += '<div class="stat-item"><span class="stat-val" style="color:var(--purple)">' + volStr + '</span> vol (lbs)</div>';
    }

    if (durationDays > 0) {
      var avgDur = Math.round(totalDuration / durationDays);
      html += '<div class="stat-item"><span class="stat-val" style="color:var(--text-secondary)">' + WT.formatDuration(avgDur) + '</span> avg time</div>';
    }

    WT.trackedMacros.forEach(function (k) {
      var m = WT.MACROS[k];
      var avg = macroDays[k] > 0 ? Math.round(macroSums[k] / macroDays[k]) : 0;
      var dayStr = macroDays[k] > 0 ? ' (' + macroDays[k] + 'd)' : '';
      html += '<div class="stat-item"><span class="stat-val" style="color:' + m.color + '">' + avg + (m.unit || '') + '</span> avg ' + m.label.toLowerCase() + dayStr + '</div>';
    });

    WT.el.statsRow.innerHTML = html;
  };

  WT.getPrevLift = function (y, m, d, dow, idx) {
    var prev = WT.addD(y, m, d, -7);
    var prevMd = WT.loadMonth(prev.y, prev.m);
    var prevId = WT.iso(prev.y, prev.m, prev.d);
    var pr = prevMd.days[prevId];
    if (pr && pr.lifts && pr.lifts[String(idx)]) {
      return WT.migrateLift(pr.lifts[String(idx)]);
    }
    return null;
  };
})();
