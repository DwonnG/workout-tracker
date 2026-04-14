window.WT = {
  db: null,
  fbRoot: '',
  el: {},
  view: { y: 0, m: 0 },
  focus: { y: 0, m: 0, d: 0 },
  viewMode: 'day',
  activeFoodLog: null,
  fbListener: null,
  appInited: false
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
    if (lw.indexOf('lift:') === 0) return 'li-lift';
    if (lw.indexOf('run:') === 0) return 'li-run';
    if (lw.indexOf('core:') === 0) return 'li-core';
    return 'li-other';
  };
})();
