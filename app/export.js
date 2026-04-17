(function () {
  var WT = window.WT;

  function collectAll() {
    var allData = { plan: WT.loadPlan(), months: {}, templates: [] };
    var today = new Date();
    for (var mo = -12; mo <= 0; mo++) {
      var dt = new Date(today.getFullYear(), today.getMonth() + mo, 1);
      var y = dt.getFullYear(), m = dt.getMonth();
      var md = WT.loadMonth(y, m);
      if (md.days && Object.keys(md.days).length) {
        var mk = y + '-' + WT.pad(m + 1);
        allData.months[mk] = md;
      }
    }
    if (WT.getTemplates) allData.templates = WT.getTemplates();
    return allData;
  }

  function toCSV() {
    var rows = [['date', 'lift', 'run', 'bodyWeight', 'bodyFat', 'protein', 'exerciseIdx', 'sets', 'volume']];
    var data = collectAll();
    var monthKeys = Object.keys(data.months).sort();
    for (var i = 0; i < monthKeys.length; i++) {
      var md = data.months[monthKeys[i]];
      var dayKeys = Object.keys(md.days || {}).sort();
      for (var j = 0; j < dayKeys.length; j++) {
        var r = md.days[dayKeys[j]];
        var baseRow = [dayKeys[j], r.lift ? '1' : '0', r.run ? '1' : '0',
          r.bodyWeight || '', r.bodyFat || '', r.p || ''];
        if (r.lifts && Object.keys(r.lifts).length) {
          var lKeys = Object.keys(r.lifts);
          for (var k = 0; k < lKeys.length; k++) {
            var ld = WT.migrateLift(r.lifts[lKeys[k]]);
            var setsStr = (ld.sets || []).map(function (s) { return s.w + 'x' + s.r; }).join(';');
            rows.push(baseRow.concat([lKeys[k], setsStr, WT.liftVolume(ld)]));
          }
        } else {
          rows.push(baseRow.concat(['', '', '']));
        }
      }
    }
    return rows.map(function (r) { return r.join(','); }).join('\n');
  }

  function download(content, filename, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  WT.exportJSON = function () {
    var data = collectAll();
    var json = JSON.stringify(data, null, 2);
    download(json, 'workout-tracker-export.json', 'application/json');
    WT.showToast('JSON exported', 'var(--green)');
  };

  WT.exportCSV = function () {
    var csv = toCSV();
    download(csv, 'workout-tracker-export.csv', 'text/csv');
    WT.showToast('CSV exported', 'var(--green)');
  };
})();
