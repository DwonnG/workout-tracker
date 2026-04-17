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

  WT.DAY_LABELS = {
    1: { label: 'Push', color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)' },
    2: { label: 'Pull', color: 'var(--blue)', bg: 'rgba(56,189,248,0.12)' },
    3: { label: 'Legs', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    4: { label: 'Push', color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)' },
    5: { label: 'Pull', color: 'var(--blue)', bg: 'rgba(56,189,248,0.12)' },
    6: { label: 'Legs + Conditioning', color: 'var(--green)', bg: 'rgba(52,211,153,0.12)' },
    0: { label: 'Rest', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' }
  };

  WT.dayType = function (lines, dow) {
    if (WT.DAY_LABELS[dow]) return WT.DAY_LABELS[dow];
    if (!lines || !lines.length || lines[0] === '\u2014') return { label: 'Rest', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
    return { label: 'Workout', color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)' };
  };

  WT.lineCategory = function (l) {
    var lw = l.toLowerCase();
    var stripped = lw.replace(/^ss:\s*/, '');
    if (stripped.indexOf('lift:') === 0) return 'li-lift';
    if (stripped.indexOf('run:') === 0) return 'li-run';
    if (stripped.indexOf('core:') === 0) return 'li-core';
    if (stripped.indexOf('cardio:') === 0) return 'li-cardio';
    if (stripped.indexOf('conditioning:') === 0) return 'li-conditioning';
    return 'li-other';
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
})();
