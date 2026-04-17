window.WT = {
  db: null,
  fbRoot: '',
  el: {},
  view: { y: 0, m: 0 },
  focus: { y: 0, m: 0, d: 0 },
  viewMode: 'day',
  activeFoodLog: null,
  fbListener: null,
  appInited: false,
  trackedMacros: ['p']
};

(function () {
  var WT = window.WT;

  WT.pad = function (n) { return String(n).padStart(2, '0'); };
  WT.iso = function (y, m, d) { return y + '-' + WT.pad(m + 1) + '-' + WT.pad(d); };
  WT.dim = function (y, m) { return new Date(y, m + 1, 0).getDate(); };
  WT.addD = function (y, m, d, n) { var t = new Date(y, m, d + n); return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() }; };
  WT.monOf = function (y, m, d) { var t = new Date(y, m, d), off = (t.getDay() + 6) % 7; var r = new Date(y, m, d - off); return { y: r.getFullYear(), m: r.getMonth(), d: r.getDate() }; };

  WT.STORAGE_PREFIX = 'wt:v2:';
  WT.PLAN_KEY = 'wt:plan:v2';
  WT.VIEW_KEY = 'wt:view';
  WT.FOCUS_KEY = 'wt:focus';
  WT.PREFS_KEY = 'wt:trackedMacros';

  WT.MACROS = {
    p:      { key: 'p',      label: 'Protein',  abbr: 'P',   unit: 'g',  color: 'var(--green)',          nutrientId: 1003 },
    cal:    { key: 'cal',    label: 'Calories', abbr: 'Cal', unit: '',   color: 'var(--accent)',         nutrientId: 1008 },
    fat:    { key: 'fat',    label: 'Fat',      abbr: 'F',   unit: 'g',  color: '#facc15',               nutrientId: 1004 },
    carb:   { key: 'carb',   label: 'Carbs',    abbr: 'C',   unit: 'g',  color: 'var(--blue)',           nutrientId: 1005 },
    sugar:  { key: 'sugar',  label: 'Sugars',   abbr: 'S',   unit: 'g',  color: 'var(--red)',            nutrientId: 2000 },
    fiber:  { key: 'fiber',  label: 'Fiber',    abbr: 'Fib', unit: 'g',  color: '#a78bfa',               nutrientId: 1079 },
    sodium: { key: 'sodium', label: 'Sodium',   abbr: 'Na',  unit: 'mg', color: 'var(--text-secondary)', nutrientId: 1093 }
  };
  WT.MACRO_ORDER = ['p', 'cal', 'fat', 'carb', 'sugar', 'fiber', 'sodium'];
  WT.DEFAULT_TRACKED = ['p'];

  WT.isTracked = function (key) { return WT.trackedMacros.indexOf(key) !== -1; };

  WT.loadPrefs = function () {
    try {
      var raw = localStorage.getItem(WT.PREFS_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch (e) { /* use default */ }
    return WT.DEFAULT_TRACKED.slice();
  };

  WT.savePrefs = function (arr) {
    WT.trackedMacros = arr;
    localStorage.setItem(WT.PREFS_KEY, JSON.stringify(arr));
  };

  WT.macroVal = function (food, key) {
    var v = food[key];
    return (v != null && !isNaN(v)) ? Number(v) : 0;
  };

  WT.formatMacro = function (val, key) {
    var m = WT.MACROS[key];
    return Math.round(val) + (m.unit ? m.unit : '');
  };

  WT.getGoal = function (md, key) {
    if (key === 'p') return md.goal != null ? md.goal : 0;
    return (md.goals && md.goals[key] != null) ? md.goals[key] : 0;
  };

  WT.saveFocus = function () { localStorage.setItem(WT.FOCUS_KEY, WT.iso(WT.focus.y, WT.focus.m, WT.focus.d)); };

  WT.DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
  WT.DOW_LABEL = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
  WT.DOW_SHORT = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  WT.MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  WT.MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  WT.WORKOUT_TYPES = {
    'Push':               { color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)' },
    'Pull':               { color: 'var(--blue)',   bg: 'rgba(56,189,248,0.12)' },
    'Legs':               { color: '#a78bfa',       bg: 'rgba(167,139,250,0.12)' },
    'Upper':              { color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)' },
    'Lower':              { color: '#a78bfa',       bg: 'rgba(167,139,250,0.12)' },
    'Full Body':          { color: 'var(--green)',  bg: 'rgba(52,211,153,0.12)' },
    'Chest & Triceps':    { color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)' },
    'Back & Biceps':      { color: 'var(--blue)',   bg: 'rgba(56,189,248,0.12)' },
    'Shoulders & Arms':   { color: '#38bdf8',       bg: 'rgba(56,189,248,0.12)' },
    'Conditioning':       { color: 'var(--green)',  bg: 'rgba(52,211,153,0.12)' },
    'Cardio':             { color: 'var(--green)',  bg: 'rgba(52,211,153,0.12)' },
    'Rest':               { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' }
  };
  WT.WORKOUT_TYPE_NAMES = Object.keys(WT.WORKOUT_TYPES);

  WT.DAY_LABELS_KEY = 'wt:dayLabels';
  WT.DEFAULT_DAY_LABELS = { 1: 'Push', 2: 'Pull', 3: 'Legs', 4: 'Push', 5: 'Pull', 6: 'Legs', 0: 'Rest' };

  WT.loadDayLabels = function () {
    try { return JSON.parse(localStorage.getItem(WT.DAY_LABELS_KEY)) || WT.DEFAULT_DAY_LABELS; }
    catch (e) { return WT.DEFAULT_DAY_LABELS; }
  };

  WT.saveDayLabels = function (labels) {
    localStorage.setItem(WT.DAY_LABELS_KEY, JSON.stringify(labels));
    if (WT.db && WT.fbRoot) WT.fbSet('dayLabels', labels);
  };

  WT.dayType = function (lines, dow) {
    var labels = WT.loadDayLabels();
    var name = labels[dow];
    if (name && WT.WORKOUT_TYPES[name]) return { label: name, color: WT.WORKOUT_TYPES[name].color, bg: WT.WORKOUT_TYPES[name].bg };
    if (!lines || !lines.length || lines[0] === '\u2014') return { label: 'Rest', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
    return { label: 'Workout', color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)' };
  };

  WT.titleCase = function (s) {
    return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  };

  WT.lineCategory = function (l) {
    var lw = l.toLowerCase();
    var stripped = lw.replace(/^ss:\s*/, '');
    if (stripped.indexOf('lift:') === 0) return 'li-lift';
    if (stripped.indexOf('run:') === 0) return 'li-run';
    if (stripped.indexOf('core:') === 0) return 'li-core';
    if (stripped.indexOf('cardio:') === 0) return 'li-cardio';
    if (stripped.indexOf('conditioning:') === 0 || stripped.indexOf('finisher:') === 0) return 'li-conditioning';
    if (stripped.indexOf('warm up:') === 0 || stripped.indexOf('warm-up:') === 0) return 'li-warmup';
    if (stripped.indexOf('cool down:') === 0 || stripped.indexOf('cool-down:') === 0) return 'li-cooldown';
    return 'li-other';
  };

  var PREFIX_NORMALIZE = [
    [/^warm-up:\s*/i, 'Warm Up: '],
    [/^warm up:\s*/i, 'Warm Up: '],
    [/^cool-down:\s*/i, 'Cool Down: '],
    [/^cool down:\s*/i, 'Cool Down: '],
    [/^finisher:\s*/i, 'Conditioning: ']
  ];

  WT.normalizePlanLine = function (line) {
    for (var i = 0; i < PREFIX_NORMALIZE.length; i++) {
      if (PREFIX_NORMALIZE[i][0].test(line)) {
        return line.replace(PREFIX_NORMALIZE[i][0], PREFIX_NORMALIZE[i][1]);
      }
    }
    return line;
  };

  WT.isSupersetLine = function (l) {
    return l.toLowerCase().indexOf('ss:') === 0;
  };

  WT.stripSS = function (l) {
    return l.replace(/^ss:\s*/i, '');
  };

  WT.groupSupersets = function (lines) {
    var groups = [];
    var current = null;
    for (var i = 0; i < lines.length; i++) {
      if (WT.isSupersetLine(lines[i])) {
        if (!current) current = { type: 'superset', items: [] };
        current.items.push({ line: WT.stripSS(lines[i]), idx: i });
      } else {
        if (current) {
          current.items.push({ line: lines[i], idx: i });
          groups.push(current);
          current = null;
        } else {
          groups.push({ type: 'single', line: lines[i], idx: i });
        }
      }
    }
    if (current) groups.push(current);
    return groups;
  };

  WT.haptic = function (pattern) {
    if (navigator.vibrate) {
      if (pattern === 'light') navigator.vibrate(10);
      else if (pattern === 'medium') navigator.vibrate(25);
      else if (pattern === 'heavy') navigator.vibrate(50);
      else if (pattern === 'success') navigator.vibrate([10, 50, 10]);
      else if (pattern === 'error') navigator.vibrate([30, 50, 30]);
      else if (Array.isArray(pattern)) navigator.vibrate(pattern);
    }
  };

  WT.SET_TYPES = {
    work:    { key: 'work',    label: 'W',  long: 'Working',  color: 'var(--accent)' },
    warmup:  { key: 'warmup',  label: 'Wu', long: 'Warm-up',  color: 'var(--text-muted)' },
    drop:    { key: 'drop',    label: 'D',  long: 'Drop',     color: '#facc15' },
    failure: { key: 'failure', label: 'F',  long: 'Failure',  color: 'var(--red)' }
  };
  WT.SET_TYPE_ORDER = ['work', 'warmup', 'drop', 'failure'];

  WT.migrateLift = function (old) {
    if (old && old.sets) return old;
    if (!old || (old.w == null && !old.r)) return { sets: [] };
    var w = parseInt(old.w, 10) || 0;
    var rStr = String(old.r || '').trim();
    if (!rStr && !w) return { sets: [] };
    var parts = rStr.split(/[,\s]+/).filter(Boolean);
    var sets = [];
    if (parts.length > 0) {
      for (var i = 0; i < parts.length; i++) {
        var rv = parseInt(parts[i], 10);
        if (!isNaN(rv)) sets.push({ w: w, r: rv, done: true, type: 'work' });
      }
    }
    if (sets.length === 0 && (w > 0 || rStr)) {
      var singleR = parseInt(rStr, 10);
      sets.push({ w: w, r: isNaN(singleR) ? 0 : singleR, done: true, type: 'work' });
    }
    return { sets: sets };
  };

  WT.liftVolume = function (liftData) {
    if (!liftData || !liftData.sets) return 0;
    var vol = 0;
    for (var i = 0; i < liftData.sets.length; i++) {
      var s = liftData.sets[i];
      if (s.done && s.type !== 'warmup') vol += (s.w || 0) * (s.r || 0);
    }
    return vol;
  };

  WT.defaultSets = function (planLine) {
    var full = planLine.match(/(\d+)\s*[x\u00d7]\s*(\d+)/i);
    if (full) {
      var numSets = parseInt(full[1], 10);
      var reps = parseInt(full[2], 10);
      var sets = [];
      for (var i = 0; i < numSets; i++) sets.push({ w: 0, r: reps, done: false, type: 'work' });
      return { sets: sets };
    }
    var partial = planLine.match(/(\d+)\s*[x\u00d7]/i);
    var n = partial ? parseInt(partial[1], 10) : 3;
    var s = [];
    for (var j = 0; j < n; j++) s.push({ w: 0, r: 0, done: false, type: 'work' });
    return { sets: s };
  };

  /* ====== Progress-view data aggregation helpers ====== */

  function iterDays(months, cb) {
    var today = new Date();
    for (var mo = -months; mo <= 0; mo++) {
      var dt = new Date(today.getFullYear(), today.getMonth() + mo, 1);
      var y = dt.getFullYear(), m = dt.getMonth();
      var md = WT.loadMonth(y, m);
      var dKeys = Object.keys(md.days || {});
      for (var i = 0; i < dKeys.length; i++) {
        var rec = md.days[dKeys[i]];
        if (rec) cb(dKeys[i], rec, md);
      }
    }
  }

  WT.liftHistory = function (exerciseName) {
    var result = {};
    iterDays(6, function (id, rec) {
      if (!rec.lifts) return;
      var keys = Object.keys(rec.lifts);
      for (var i = 0; i < keys.length; i++) {
        var ld = WT.migrateLift(rec.lifts[keys[i]]);
        if (!ld.sets || !ld.sets.length) continue;
        var bestW = 0, bestR = 0;
        for (var s = 0; s < ld.sets.length; s++) {
          var st = ld.sets[s];
          if (st.done && st.type !== 'warmup' && st.w > bestW) { bestW = st.w; bestR = st.r; }
        }
        if (bestW <= 0) continue;
        var name = WT.titleCase(exerciseName ? keys[i] : keys[i]);
        if (!result[id]) result[id] = {};
        result[id][keys[i]] = { w: bestW, r: bestR, vol: WT.liftVolume(ld) };
      }
    });
    return result;
  };

  WT.loggedExercises = function () {
    var names = {};
    var snap = WT.loadPlan();
    var dayLabels = WT.loadDayLabels();
    iterDays(6, function (id, rec) {
      if (!rec.lifts) return;
      var parts = id.split('-');
      var dow = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getDay();
      var lines = WT.planLines(snap, dow);
      var group = dayLabels[dow] || 'Other';
      var lKeys = Object.keys(rec.lifts);
      for (var i = 0; i < lKeys.length; i++) {
        var ld = WT.migrateLift(rec.lifts[lKeys[i]]);
        if (!ld.sets || !ld.sets.length) continue;
        var hasWork = false;
        for (var s = 0; s < ld.sets.length; s++) { if (ld.sets[s].done && ld.sets[s].w > 0) { hasWork = true; break; } }
        if (!hasWork) continue;
        var idx = parseInt(lKeys[i], 10);
        var line = (lines && lines[idx]) ? lines[idx] : 'Exercise ' + idx;
        var label = line.replace(/^(lift|conditioning|warm\s*up|cool\s*down):\s*/i, '').replace(/\s*\d+\s*[x\u00d7].*$/i, '').trim();
        label = WT.titleCase(label);
        if (!names[label]) names[label] = { key: lKeys[i], line: line, count: 0, group: group };
        names[label].count++;
      }
    });
    return names;
  };

  WT.exerciseTrend = function (exerciseLabel) {
    var snap = WT.loadPlan();
    var points = [];
    iterDays(6, function (id, rec) {
      if (!rec.lifts) return;
      var parts = id.split('-');
      var dow = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getDay();
      var lines = WT.planLines(snap, dow);
      var lKeys = Object.keys(rec.lifts);
      for (var i = 0; i < lKeys.length; i++) {
        var idx = parseInt(lKeys[i], 10);
        var line = (lines && lines[idx]) ? lines[idx] : '';
        var label = line.replace(/^(lift|conditioning|warm\s*up|cool\s*down):\s*/i, '').replace(/\s*\d+\s*[x\u00d7].*$/i, '').trim();
        if (WT.titleCase(label) !== exerciseLabel) continue;
        var ld = WT.migrateLift(rec.lifts[lKeys[i]]);
        var best = 0;
        if (ld.sets) {
          for (var s = 0; s < ld.sets.length; s++) {
            var st = ld.sets[s];
            if (st.done && st.type !== 'warmup' && st.w > best) best = st.w;
          }
        }
        if (best > 0) points.push({ date: id, weight: best, vol: WT.liftVolume(ld) });
      }
    });
    points.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return points;
  };

  WT.weeklyVolume = function (weeks) {
    weeks = weeks || 8;
    var today = new Date();
    var result = [];
    var labels = [];
    for (var w = weeks - 1; w >= 0; w--) {
      var weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - w * 7 + 1);
      var vol = 0;
      for (var d = 0; d < 7; d++) {
        var day = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + d);
        var y = day.getFullYear(), m = day.getMonth();
        var id = WT.iso(y, m, day.getDate());
        var md = WT.loadMonth(y, m);
        var rec = md.days && md.days[id];
        if (!rec || !rec.lifts) continue;
        var lKeys = Object.keys(rec.lifts);
        for (var j = 0; j < lKeys.length; j++) {
          vol += WT.liftVolume(WT.migrateLift(rec.lifts[lKeys[j]]));
        }
      }
      result.push(vol);
      labels.push(WT.MONTH_SHORT[weekStart.getMonth()] + ' ' + weekStart.getDate());
    }
    return { data: result, labels: labels };
  };

  WT.consistencyGrid = function (weeks) {
    weeks = weeks || 8;
    var today = new Date();
    var totalDays = weeks * 7;
    var start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - totalDays + 1);
    var dow = (start.getDay() + 6) % 7;
    start = new Date(start.getFullYear(), start.getMonth(), start.getDate() - dow);
    var grid = [];
    var cur = new Date(start);
    while (cur <= today) {
      var y = cur.getFullYear(), m = cur.getMonth(), d = cur.getDate();
      var id = WT.iso(y, m, d);
      var md = WT.loadMonth(y, m);
      var rec = md.days && md.days[id];
      var val = 0;
      if (rec) {
        if (rec.lift || rec.run) val = 1;
        if (rec.lifts) {
          var lk = Object.keys(rec.lifts);
          for (var j = 0; j < lk.length; j++) {
            var v = WT.liftVolume(WT.migrateLift(rec.lifts[lk[j]]));
            if (v > val) val = v;
          }
        }
      }
      grid.push(val);
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
    return grid;
  };

  WT.bodyMetricsTrend = function (months) {
    months = months || 3;
    var points = [];
    iterDays(months, function (id, rec) {
      if (rec.bodyWeight != null || rec.bodyFat != null) {
        points.push({ date: id, weight: rec.bodyWeight || null, fat: rec.bodyFat || null });
      }
    });
    points.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return points;
  };

  WT.nutritionTrend = function (days, macroKey) {
    days = days || 28;
    macroKey = macroKey || 'p';
    var today = new Date();
    var result = [];
    var labels = [];
    for (var d = days - 1; d >= 0; d--) {
      var day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);
      var y = day.getFullYear(), m = day.getMonth();
      var id = WT.iso(y, m, day.getDate());
      var md = WT.loadMonth(y, m);
      var rec = md.days && md.days[id];
      var total = 0;
      if (rec && rec.totals && rec.totals[macroKey] != null) {
        total = rec.totals[macroKey];
      } else if (rec && rec.foods) {
        var foods = Array.isArray(rec.foods) ? rec.foods : [];
        for (var f = 0; f < foods.length; f++) {
          total += WT.macroVal(foods[f], macroKey);
        }
      }
      result.push(Math.round(total));
      labels.push((day.getMonth() + 1) + '/' + day.getDate());
    }
    return { data: result, labels: labels };
  };

  WT.progressSummary = function () {
    var today = new Date();
    var thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1);
    var lastWeekStart = new Date(thisWeekStart.getFullYear(), thisWeekStart.getMonth(), thisWeekStart.getDate() - 7);
    var workoutsThisWeek = 0, workoutsLastWeek = 0;
    var volThisWeek = 0, volLastWeek = 0;
    var proteinDays = 0, proteinSum = 0;
    var latestWeight = null;

    function countWeek(start, end) {
      var w = 0, v = 0;
      for (var d = new Date(start); d < end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        var y = d.getFullYear(), m = d.getMonth();
        var id = WT.iso(y, m, d.getDate());
        var md = WT.loadMonth(y, m);
        var rec = md.days && md.days[id];
        if (!rec) continue;
        if (rec.lift || rec.run || (rec.lifts && Object.keys(rec.lifts).length > 0)) w++;
        if (rec.lifts) {
          var lk = Object.keys(rec.lifts);
          for (var j = 0; j < lk.length; j++) v += WT.liftVolume(WT.migrateLift(rec.lifts[lk[j]]));
        }
      }
      return { workouts: w, volume: v };
    }

    var tw = countWeek(thisWeekStart, new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
    var lw = countWeek(lastWeekStart, thisWeekStart);
    workoutsThisWeek = tw.workouts;
    workoutsLastWeek = lw.workouts;
    volThisWeek = tw.volume;
    volLastWeek = lw.volume;

    for (var pd = 0; pd < 7; pd++) {
      var day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - pd);
      var id = WT.iso(day.getFullYear(), day.getMonth(), day.getDate());
      var md = WT.loadMonth(day.getFullYear(), day.getMonth());
      var rec = md.days && md.days[id];
      if (rec) {
        var primaryKey = (WT.trackedMacros && WT.trackedMacros[0]) || 'p';
        var pVal = (rec.totals && rec.totals[primaryKey] != null) ? rec.totals[primaryKey] : 0;
        if (pVal > 0) { proteinSum += pVal; proteinDays++; }
        if (latestWeight == null && rec.bodyWeight) latestWeight = rec.bodyWeight;
      }
    }

    return {
      workouts: workoutsThisWeek,
      workoutsDelta: workoutsThisWeek - workoutsLastWeek,
      avgVolume: volThisWeek,
      volumeDelta: volThisWeek - volLastWeek,
      avgProtein: proteinDays > 0 ? Math.round(proteinSum / proteinDays) : 0,
      bodyWeight: latestWeight
    };
  };
})();
