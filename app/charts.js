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

  /* ====== Canvas chart utilities for Progress view ====== */

  var DPR = window.devicePixelRatio || 1;

  function sizeCanvas(canvas, w, h) {
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);
    return ctx;
  }

  function niceMax(v) {
    if (v <= 0) return 10;
    var mag = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / mag;
    if (n <= 1) return mag;
    if (n <= 2) return 2 * mag;
    if (n <= 5) return 5 * mag;
    return 10 * mag;
  }

  WT.drawLineChart = function (canvas, data, opts) {
    opts = opts || {};
    var W = opts.width || canvas.parentElement.clientWidth || 320;
    var H = opts.height || 160;
    var ctx = sizeCanvas(canvas, W, H);
    var PAD_L = 38, PAD_R = 12, PAD_T = 14, PAD_B = 24;
    var cw = W - PAD_L - PAD_R, ch = H - PAD_T - PAD_B;
    var color = opts.color || 'var(--accent)';
    var goalLine = opts.goalLine;
    var labels = opts.labels;

    if (!data || data.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', W / 2, H / 2);
      return;
    }

    var resolvedColor = (function () {
      var el = document.createElement('span');
      el.style.color = color;
      document.body.appendChild(el);
      var c = getComputedStyle(el).color;
      document.body.removeChild(el);
      return c;
    })();

    var maxV = 0, minV = Infinity;
    for (var i = 0; i < data.length; i++) {
      if (data[i] > maxV) maxV = data[i];
      if (data[i] < minV) minV = data[i];
    }
    if (goalLine != null && goalLine > maxV) maxV = goalLine;
    var range = maxV - minV || 1;
    minV = Math.max(0, minV - range * 0.1);
    maxV = maxV + range * 0.1;
    range = maxV - minV;

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (var g = 0; g <= 4; g++) {
      var gy = PAD_T + (g / 4) * ch;
      ctx.beginPath(); ctx.moveTo(PAD_L, gy); ctx.lineTo(W - PAD_R, gy); ctx.stroke();
      ctx.fillText(Math.round(maxV - (g / 4) * range), PAD_L - 4, gy + 3);
    }

    if (goalLine != null) {
      var goalY = PAD_T + (1 - (goalLine - minV) / range) * ch;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.moveTo(PAD_L, goalY); ctx.lineTo(W - PAD_R, goalY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'right';
      ctx.fillText('Goal', W - PAD_R - 46, goalY - 4);
    }

    var pts = [];
    for (var j = 0; j < data.length; j++) {
      pts.push({
        x: PAD_L + (data.length === 1 ? cw / 2 : (j / (data.length - 1)) * cw),
        y: PAD_T + (1 - (data[j] - minV) / range) * ch
      });
    }

    var grad = ctx.createLinearGradient(0, PAD_T, 0, H - PAD_B);
    grad.addColorStop(0, resolvedColor.replace(')', ', 0.25)').replace('rgb(', 'rgba('));
    grad.addColorStop(1, resolvedColor.replace(')', ', 0)').replace('rgb(', 'rgba('));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H - PAD_B);
    for (var f = 0; f < pts.length; f++) ctx.lineTo(pts[f].x, pts[f].y);
    ctx.lineTo(pts[pts.length - 1].x, H - PAD_B);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
    ctx.strokeStyle = resolvedColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    for (var d = 0; d < pts.length; d++) {
      ctx.beginPath();
      ctx.arc(pts[d].x, pts[d].y, d === pts.length - 1 ? 4 : 2, 0, Math.PI * 2);
      ctx.fillStyle = d === pts.length - 1 ? resolvedColor : '#1a1a2e';
      ctx.fill();
      ctx.strokeStyle = resolvedColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (labels && labels.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '8px Inter, sans-serif';
      ctx.textAlign = 'center';
      var step = Math.max(1, Math.floor(labels.length / 5));
      for (var lb = 0; lb < labels.length; lb += step) {
        var lx = PAD_L + (labels.length === 1 ? cw / 2 : (lb / (labels.length - 1)) * cw);
        ctx.fillText(labels[lb], lx, H - 4);
      }
      if ((labels.length - 1) % step !== 0) {
        var lastX = PAD_L + cw;
        ctx.fillText(labels[labels.length - 1], lastX, H - 4);
      }
    }
  };

  WT.drawBarChart = function (canvas, data, opts) {
    opts = opts || {};
    var W = opts.width || canvas.parentElement.clientWidth || 320;
    var H = opts.height || 140;
    var ctx = sizeCanvas(canvas, W, H);
    var PAD_L = 38, PAD_R = 12, PAD_T = 10, PAD_B = 24;
    var cw = W - PAD_L - PAD_R, ch = H - PAD_T - PAD_B;
    var color = opts.color || 'var(--accent)';
    var labels = opts.labels;

    if (!data || data.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', W / 2, H / 2);
      return;
    }

    var resolvedColor = (function () {
      var el = document.createElement('span');
      el.style.color = color;
      document.body.appendChild(el);
      var c = getComputedStyle(el).color;
      document.body.removeChild(el);
      return c;
    })();

    var maxV = 0;
    for (var i = 0; i < data.length; i++) { if (data[i] > maxV) maxV = data[i]; }
    maxV = niceMax(maxV);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (var g = 0; g <= 4; g++) {
      var gy = PAD_T + (g / 4) * ch;
      ctx.beginPath(); ctx.moveTo(PAD_L, gy); ctx.lineTo(W - PAD_R, gy); ctx.stroke();
      ctx.fillText(Math.round(maxV - (g / 4) * maxV), PAD_L - 4, gy + 3);
    }

    var barGap = 4;
    var barW = (cw - barGap * (data.length - 1)) / data.length;
    barW = Math.min(barW, 40);
    var totalBars = barW * data.length + barGap * (data.length - 1);
    var offsetX = PAD_L + (cw - totalBars) / 2;

    for (var j = 0; j < data.length; j++) {
      var bh = maxV > 0 ? (data[j] / maxV) * ch : 0;
      var bx = offsetX + j * (barW + barGap);
      var by = PAD_T + ch - bh;
      var radius = Math.min(4, barW / 2);
      ctx.beginPath();
      ctx.moveTo(bx, by + radius);
      ctx.arcTo(bx, by, bx + radius, by, radius);
      ctx.arcTo(bx + barW, by, bx + barW, by + radius, radius);
      ctx.lineTo(bx + barW, PAD_T + ch);
      ctx.lineTo(bx, PAD_T + ch);
      ctx.closePath();
      ctx.fillStyle = resolvedColor;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (labels && labels.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '8px Inter, sans-serif';
      ctx.textAlign = 'center';
      for (var lb = 0; lb < labels.length; lb++) {
        var lx = offsetX + lb * (barW + barGap) + barW / 2;
        ctx.fillText(labels[lb], lx, H - 4);
      }
    }
  };

  WT.drawHeatmap = function (canvas, grid, opts) {
    opts = opts || {};
    var cols = 7, rows = grid.length ? Math.ceil(grid.length / cols) : 8;
    var cellSize = opts.cellSize || 18;
    var gap = opts.gap || 3;
    var W = cols * (cellSize + gap) - gap + 20;
    var H = rows * (cellSize + gap) - gap + 24;
    var ctx = sizeCanvas(canvas, W, H);
    var color = opts.color || 'var(--green)';

    var resolvedColor = (function () {
      var el = document.createElement('span');
      el.style.color = color;
      document.body.appendChild(el);
      var c = getComputedStyle(el).color;
      document.body.removeChild(el);
      return c;
    })();

    var dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (var d = 0; d < 7; d++) {
      ctx.fillText(dayLabels[d], d * (cellSize + gap) + cellSize / 2, 10);
    }

    var maxV = 0;
    for (var i = 0; i < grid.length; i++) { if (grid[i] > maxV) maxV = grid[i]; }

    for (var c2 = 0; c2 < grid.length; c2++) {
      var row = Math.floor(c2 / cols);
      var col = c2 % cols;
      var x = col * (cellSize + gap);
      var y = 16 + row * (cellSize + gap);
      var radius = 3;

      if (grid[c2] > 0 && maxV > 0) {
        var intensity = 0.2 + 0.8 * (grid[c2] / maxV);
        ctx.fillStyle = resolvedColor;
        ctx.globalAlpha = intensity;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + cellSize, y, x + cellSize, y + cellSize, radius);
      ctx.arcTo(x + cellSize, y + cellSize, x, y + cellSize, radius);
      ctx.arcTo(x, y + cellSize, x, y, radius);
      ctx.arcTo(x, y, x + cellSize, y, radius);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };
})();
