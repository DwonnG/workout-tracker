(function () {
  var WT = window.WT;
  var chartModal, chartSvg, chartTitle, chartPrBadge;

  function epley1RM(w, r) {
    if (r <= 0 || w <= 0) return 0;
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30));
  }

  function bestSetE1RM(liftData) {
    if (!liftData || !liftData.sets) return 0;
    var best = 0;
    for (var i = 0; i < liftData.sets.length; i++) {
      var s = liftData.sets[i];
      if (s.done && s.type !== 'warmup') {
        var e = epley1RM(s.w || 0, s.r || 0);
        if (e > best) best = e;
      }
    }
    return best;
  }

  function collectHistory(liftName) {
    var points = [];
    var today = new Date();
    for (var mo = -6; mo <= 0; mo++) {
      var dt = new Date(today.getFullYear(), today.getMonth() + mo, 1);
      var y = dt.getFullYear(), m = dt.getMonth();
      var md = WT.loadMonth(y, m);
      var days = md.days || {};
      var dKeys = Object.keys(days);
      for (var i = 0; i < dKeys.length; i++) {
        var rec = days[dKeys[i]];
        if (!rec || !rec.lifts) continue;
        var lKeys = Object.keys(rec.lifts);
        for (var j = 0; j < lKeys.length; j++) {
          var ld = WT.migrateLift(rec.lifts[lKeys[j]]);
          var e1rm = bestSetE1RM(ld);
          if (e1rm > 0) {
            points.push({ date: dKeys[i], e1rm: e1rm, vol: WT.liftVolume(ld), liftIdx: lKeys[j] });
          }
        }
      }
    }
    points.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return points;
  }

  function collectExerciseHistory(planLine, y, m, d) {
    var dow = new Date(y, m, d).getDay();
    var snap = WT.loadPlan();
    var lines = WT.planLines(snap, dow);
    var targetIdx = -1;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i] === planLine) { targetIdx = i; break; }
    }
    if (targetIdx < 0) return [];

    var points = [];
    var today = new Date();
    for (var wk = -26; wk <= 0; wk++) {
      var fd = WT.addD(y, m, d, wk * 7);
      var checkDow = new Date(fd.y, fd.m, fd.d).getDay();
      if (checkDow !== dow) continue;
      var fmd = WT.loadMonth(fd.y, fd.m);
      var fid = WT.iso(fd.y, fd.m, fd.d);
      var frec = fmd.days && fmd.days[fid];
      if (!frec || !frec.lifts || !frec.lifts[String(targetIdx)]) continue;
      var ld = WT.migrateLift(frec.lifts[String(targetIdx)]);
      var e = bestSetE1RM(ld);
      if (e > 0) points.push({ date: fid, e1rm: e, vol: WT.liftVolume(ld) });
    }
    return points;
  }

  function renderChart(points, container) {
    container.innerHTML = '';
    if (points.length < 2) {
      container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:2rem;font-size:.82rem">Need at least 2 sessions to show chart</div>';
      return;
    }
    var W = 340, H = 160, PAD = 30, PADT = 15;
    var maxE = 0, minE = Infinity;
    for (var i = 0; i < points.length; i++) {
      if (points[i].e1rm > maxE) maxE = points[i].e1rm;
      if (points[i].e1rm < minE) minE = points[i].e1rm;
    }
    var range = maxE - minE || 1;
    minE = Math.max(0, minE - range * 0.1);
    maxE = maxE + range * 0.1;
    range = maxE - minE;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', '100%');
    svg.style.display = 'block';

    var pathD = '';
    var dots = [];
    for (var j = 0; j < points.length; j++) {
      var x = PAD + (j / (points.length - 1)) * (W - PAD * 2);
      var y = PADT + (1 - (points[j].e1rm - minE) / range) * (H - PADT - PAD);
      if (j === 0) pathD += 'M' + x + ',' + y;
      else pathD += ' L' + x + ',' + y;
      dots.push({ x: x, y: y, p: points[j] });
    }

    var gridLines = 4;
    for (var g = 0; g <= gridLines; g++) {
      var gy = PADT + (g / gridLines) * (H - PADT - PAD);
      var val = Math.round(maxE - (g / gridLines) * range);
      var gLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gLine.setAttribute('x1', PAD); gLine.setAttribute('x2', W - PAD);
      gLine.setAttribute('y1', gy); gLine.setAttribute('y2', gy);
      gLine.setAttribute('stroke', 'rgba(255,255,255,0.06)'); gLine.setAttribute('stroke-width', '1');
      svg.appendChild(gLine);
      var gLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      gLabel.setAttribute('x', PAD - 4); gLabel.setAttribute('y', gy + 3);
      gLabel.setAttribute('text-anchor', 'end');
      gLabel.setAttribute('fill', 'rgba(255,255,255,0.3)');
      gLabel.setAttribute('font-size', '9');
      gLabel.textContent = val;
      svg.appendChild(gLabel);
    }

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--accent)');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);

    for (var k = 0; k < dots.length; k++) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', dots[k].x); c.setAttribute('cy', dots[k].y);
      c.setAttribute('r', k === dots.length - 1 ? '4' : '2.5');
      c.setAttribute('fill', k === dots.length - 1 ? 'var(--accent)' : 'var(--bg-elevated)');
      c.setAttribute('stroke', 'var(--accent)'); c.setAttribute('stroke-width', '1.5');
      svg.appendChild(c);
    }

    if (dots.length > 0) {
      var first = dots[0].p, last = dots[dots.length - 1].p;
      var fLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      fLabel.setAttribute('x', PAD); fLabel.setAttribute('y', H - 4);
      fLabel.setAttribute('fill', 'rgba(255,255,255,0.3)'); fLabel.setAttribute('font-size', '8');
      fLabel.textContent = first.date.slice(5);
      svg.appendChild(fLabel);
      var lLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lLabel.setAttribute('x', W - PAD); lLabel.setAttribute('y', H - 4);
      lLabel.setAttribute('text-anchor', 'end');
      lLabel.setAttribute('fill', 'rgba(255,255,255,0.3)'); lLabel.setAttribute('font-size', '8');
      lLabel.textContent = last.date.slice(5);
      svg.appendChild(lLabel);
    }

    container.appendChild(svg);
  }

  WT.checkPR = function (liftData, planLine, y, m, d) {
    var todayBest = bestSetE1RM(liftData);
    if (todayBest <= 0) return false;
    var points = collectExerciseHistory(planLine, y, m, d);
    for (var i = 0; i < points.length; i++) {
      if (points[i].date !== WT.iso(y, m, d) && points[i].e1rm >= todayBest) return false;
    }
    return points.length > 0;
  };

  WT.openChart = function (planLine, y, m, d) {
    if (!chartModal) return;
    var label = planLine.replace(/^lift:\s*/i, '');
    chartTitle.textContent = label;
    var points = collectExerciseHistory(planLine, y, m, d);
    renderChart(points, chartSvg);

    if (points.length > 0) {
      var allTime = 0;
      for (var i = 0; i < points.length; i++) { if (points[i].e1rm > allTime) allTime = points[i].e1rm; }
      chartPrBadge.textContent = 'All-time est. 1RM: ' + allTime + ' lbs';
      chartPrBadge.style.display = '';
    } else {
      chartPrBadge.style.display = 'none';
    }

    chartModal.classList.add('open');
  };

  WT.initCharts = function () {
    chartModal = document.getElementById('chartModal');
    if (!chartModal) return;
    chartSvg = document.getElementById('chartSvgWrap');
    chartTitle = document.getElementById('chartTitle');
    chartPrBadge = document.getElementById('chartPrBadge');

    document.getElementById('chartModalClose').addEventListener('click', function () {
      chartModal.classList.remove('open');
    });
    chartModal.addEventListener('click', function (e) { if (e.target === chartModal) chartModal.classList.remove('open'); });
  };
})();
