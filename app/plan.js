(function () {
  var WT = window.WT;

  WT.buildPlanFields = function () {
    var w = document.getElementById('planFields'); if (!w) return; w.innerHTML = '';
    var p = WT.loadPlan();
    WT.DOW_ORDER.forEach(function (dow) {
      var card = document.createElement('div'); card.className = 'plan-day';
      var header = document.createElement('div'); header.className = 'plan-day-header';
      var lab = document.createElement('label'); lab.setAttribute('for', 'planTa' + dow); lab.textContent = WT.DOW_LABEL[dow];
      var dt = WT.DAY_LABELS[dow] || { label: '', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
      var badge = document.createElement('span'); badge.className = 'plan-day-badge';
      badge.textContent = dt.label; badge.style.color = dt.color; badge.style.background = dt.bg;
      header.appendChild(lab); header.appendChild(badge); card.appendChild(header);
      var ta = document.createElement('textarea');
      ta.id = 'planTa' + dow; ta.rows = 4; ta.value = (p[dow] || []).join('\n');
      card.appendChild(ta); w.appendChild(card);
    });
  };

  WT.readPlanForm = function () {
    var o = {};
    WT.DOW_ORDER.forEach(function (dow) {
      var ta = document.getElementById('planTa' + dow), txt = ta ? ta.value : '';
      o[dow] = txt.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!o[dow].length) o[dow] = (WT.DEFAULT_PLAN[dow] || []).slice();
    });
    return o;
  };

  WT.buildPlanList = function (snap, dow, cls) {
    var ul = document.createElement('ul'); ul.className = 'day-plan' + (cls ? ' ' + cls : '');
    WT.planLines(snap, dow).forEach(function (l) {
      var li = document.createElement('li'); li.className = WT.lineCategory(l); li.textContent = l; ul.appendChild(li);
    });
    return ul;
  };
})();
