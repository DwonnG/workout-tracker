(function () {
  var WT = window.WT;

  WT.makeCheck = function (label, cls, checked, ariaId, y, m, id, field) {
    var row = document.createElement('div'); row.className = 'check-row';
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = checked;
    cb.setAttribute('aria-label', label + ' ' + ariaId);
    cb.addEventListener('change', function () {
      var dt = WT.loadMonth(y, m); WT.ensureRec(dt, id); dt.days[id][field] = cb.checked;
      if (dt.goal == null) dt.goal = parseInt(WT.el.goal.value, 10) || 0;
      WT.saveMonth(y, m, dt); WT.renderStats();
    });
    row.appendChild(cb);
    var tag = document.createElement('span'); tag.className = 'tag ' + cls; tag.textContent = label;
    row.appendChild(tag); return row;
  };

  WT.renderStats = function () {
    var mn = WT.monOf(WT.focus.y, WT.focus.m, WT.focus.d), snap = WT.loadPlan();
    var lifts = 0, liftTotal = 0, runs = 0, runTotal = 0, proteinSum = 0, proteinDays = 0;
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
      var pv = parseInt(rec.p, 10);
      if (!isNaN(pv) && pv > 0) { proteinSum += pv; proteinDays++; }
    }
    var avgP = proteinDays > 0 ? Math.round(proteinSum / proteinDays) : 0;
    WT.el.statsRow.innerHTML =
      '<div class="stat-item"><span class="stat-val accent">' + lifts + '/' + (liftTotal || '\u2014') + '</span> lifts</div>' +
      '<div class="stat-item"><span class="stat-val blue">' + runs + '/' + (runTotal || '\u2014') + '</span> runs</div>' +
      '<div class="stat-item"><span class="stat-val green">' + avgP + 'g</span> avg protein' + (proteinDays > 0 ? ' (' + proteinDays + ' day' + (proteinDays > 1 ? 's' : '') + ')' : '') + '</div>';
  };

  WT.getPrevLift = function (y, m, d, dow, idx) {
    var prev = WT.addD(y, m, d, -7);
    var prevMd = WT.loadMonth(prev.y, prev.m);
    var prevId = WT.iso(prev.y, prev.m, prev.d);
    var pr = prevMd.days[prevId];
    if (pr && pr.lifts && pr.lifts[String(idx)]) return pr.lifts[String(idx)];
    return null;
  };
})();
