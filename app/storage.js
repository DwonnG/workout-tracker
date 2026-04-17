(function () {
  var WT = window.WT;

  WT.DEFAULT_PLAN = {
    1: ['Warm Up: Jump Rope 2min', 'Lift: Bench Press 4\u00d78', 'Lift: Incline DB Press 3\u00d710', 'Lift: Shoulder Press 3\u00d710', 'Lift: EZ-Bar Skull Crusher 3\u00d712', 'Lift: Lateral Raise 3\u00d715', 'Cool Down: Foam Roll 5min'],
    2: ['Warm Up: Dynamic Stretches 5min', 'Lift: Band-Assisted Pull-Up 4\u00d78', 'Lift: Barbell Row 4\u00d78', 'Lift: Landmine Row 3\u00d710', 'Lift: Face Pull 3\u00d715', 'Lift: EZ-Bar Curl 3\u00d712', 'Lift: Hammer Curl 3\u00d712', 'Cool Down: Static Stretches 5min'],
    3: ['Warm Up: Stationary Bike 3min', 'Lift: Barbell Squat 4\u00d76', 'Lift: Barbell RDL 3\u00d78', 'Lift: Rear-Foot-Elevated Split Squat 3\u00d78/leg', 'Lift: Calf Raise 3\u00d715', 'Core: Ab Wheel 3\u00d710', 'Core: Plank 3\u00d745sec', 'Cool Down: Hamstring Stretch 5min'],
    4: ['Warm Up: Light Jog 3min', 'Lift: Landmine Press 3\u00d710', 'Lift: DB Press 3\u00d710', 'Lift: Dip 3\u00d7submax', 'Lift: Lateral Raise 3\u00d715', 'Lift: EZ-Bar Skull Crusher 3\u00d712', 'Cool Down: Foam Roll 5min'],
    5: ['Warm Up: Jump Rope 2min', 'Lift: Pull-Up 4\u00d7submax', 'Lift: Barbell Row 4\u00d78', 'Lift: DB Row 3\u00d710', 'Lift: EZ-Bar Curl 3\u00d712', 'Lift: Face Pull 3\u00d715', 'Cool Down: Yoga Flow 5min'],
    6: ['Warm Up: Dynamic Stretches 5min', 'Lift: Goblet Squat 3\u00d712', 'Lift: Step-Up 3\u00d710/leg', 'Lift: Kettlebell Swing 3\u00d715', 'Core: Ab Wheel 3\u00d710', 'Core: Russian Twist 3\u00d720', 'Cool Down: Static Stretches 5min'],
    0: ['Cool Down: Light Walk 20min']
  };

  WT.cloneDefault = function () {
    var o = {};
    for (var d = 0; d <= 6; d++) o[d] = (WT.DEFAULT_PLAN[d] || []).slice();
    return o;
  };

  WT.loadPlan = function () {
    try {
      var r = localStorage.getItem(WT.PLAN_KEY);
      if (!r) return WT.cloneDefault();
      var o = JSON.parse(r), m = WT.cloneDefault(), changed = false;
      for (var d = 0; d <= 6; d++) {
        var k = String(d);
        if (Array.isArray(o[k]) && o[k].length) {
          m[d] = o[k].map(function (l) {
            var norm = WT.normalizePlanLine(String(l));
            if (norm !== String(l)) changed = true;
            return norm;
          });
        }
      }
      if (changed) WT.savePlan(m);
      return m;
    } catch (e) { return WT.cloneDefault(); }
  };

  WT.savePlan = function (p) {
    var s = {};
    for (var d = 0; d <= 6; d++) s[String(d)] = p[d] || [];
    localStorage.setItem(WT.PLAN_KEY, JSON.stringify(s));
    WT.fbSet('plan', s);
  };

  WT.planLines = function (snap, dow) { var x = snap[dow]; return x && x.length ? x : ['\u2014']; };

  WT.loadMonth = function (y, m) {
    try {
      var r = localStorage.getItem(WT.STORAGE_PREFIX + y + '-' + WT.pad(m + 1));
      if (!r) return { goal: null, goals: {}, days: {} };
      var o = JSON.parse(r);
      return { goal: o.goal != null ? o.goal : null, goals: o.goals || {}, days: o.days || {} };
    } catch (e) { return { goal: null, goals: {}, days: {} }; }
  };

  WT.saveMonth = function (y, m, d) {
    var mk = y + '-' + WT.pad(m + 1);
    localStorage.setItem(WT.STORAGE_PREFIX + mk, JSON.stringify(d));
    WT.fbSet('months/' + mk, d);
  };

  function toArray(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      var keys = Object.keys(v), arr = [];
      for (var i = 0; i < keys.length; i++) arr.push(v[keys[i]]);
      return arr;
    }
    return [];
  }

  WT.toArray = toArray;

  WT.ensureRec = function (md, id) {
    if (!md.days[id]) md.days[id] = { lift: false, run: false, p: '', foods: [], lifts: {}, totals: {} };
    var r = md.days[id];
    if (r.w !== undefined) { r.lift = !!r.w; delete r.w; }
    r.foods = toArray(r.foods);
    if (!r.lifts) r.lifts = {};
    if (!r.totals) r.totals = {};
    var keys = Object.keys(r.lifts);
    for (var i = 0; i < keys.length; i++) {
      r.lifts[keys[i]] = WT.migrateLift(r.lifts[keys[i]]);
      if (r.lifts[keys[i]] && r.lifts[keys[i]].sets) {
        r.lifts[keys[i]].sets = toArray(r.lifts[keys[i]].sets);
      }
    }
    return r;
  };

  WT.stampStart = function (y, m, id) {
    var md = WT.loadMonth(y, m); WT.ensureRec(md, id);
    if (!md.days[id].startedAt) {
      md.days[id].startedAt = new Date().toISOString();
      WT.saveMonth(y, m, md);
    }
  };

  WT.stampFinish = function (y, m, id) {
    var md = WT.loadMonth(y, m); WT.ensureRec(md, id);
    md.days[id].finishedAt = new Date().toISOString();
    WT.saveMonth(y, m, md);
  };

  WT.workoutDuration = function (rec) {
    if (!rec || !rec.startedAt) return null;
    var start = new Date(rec.startedAt).getTime();
    var end = rec.finishedAt ? new Date(rec.finishedAt).getTime() : Date.now();
    var mins = Math.round((end - start) / 60000);
    return mins > 0 ? mins : null;
  };

  WT.formatDuration = function (mins) {
    if (mins == null) return '';
    if (mins < 60) return mins + 'min';
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return h + 'h' + (m > 0 ? ' ' + m + 'm' : '');
  };

  WT.syncGoal = function () {};

  WT.migrateOldData = function () {
    var OLD_PREFIX = 'workoutProteinTracker:v1:';
    var OLD_PLAN = 'workoutProteinTracker:weeklyPlan:v1';
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && k.indexOf(OLD_PREFIX) === 0) {
        var mk = k.slice(OLD_PREFIX.length);
        if (!localStorage.getItem(WT.STORAGE_PREFIX + mk)) {
          localStorage.setItem(WT.STORAGE_PREFIX + mk, localStorage.getItem(k));
        }
        localStorage.removeItem(k);
      }
    }
    var oldPlan = localStorage.getItem(OLD_PLAN);
    if (oldPlan && !localStorage.getItem(WT.PLAN_KEY)) localStorage.setItem(WT.PLAN_KEY, oldPlan);
    if (oldPlan) localStorage.removeItem(OLD_PLAN);
    var oldView = localStorage.getItem('workoutProteinTracker:viewMode:v1');
    if (oldView) { localStorage.setItem(WT.VIEW_KEY, oldView); localStorage.removeItem('workoutProteinTracker:viewMode:v1'); }
    var oldFocus = localStorage.getItem('workoutProteinTracker:focusDay:v1');
    if (oldFocus) { localStorage.setItem(WT.FOCUS_KEY, oldFocus); localStorage.removeItem('workoutProteinTracker:focusDay:v1'); }
  };
})();
