(function () {
  var WT = window.WT;

  WT.DEFAULT_PLAN = {
    1: ['Run: C25K warm-up', 'Lift: bench press 4\u00d78', 'Lift: incline DB press 3\u00d710', 'Lift: shoulder press 3\u00d710', 'Lift: EZ-bar skull crushers 3\u00d712', 'Lift: lateral raise 3\u00d715', 'Finisher: battle ropes 6 rounds'],
    2: ['Warm-up: jump rope 2 min', 'Lift: band-assisted pull-ups 4\u00d78', 'Lift: barbell row 4\u00d78', 'Lift: landmine row 3\u00d710', 'Lift: face pulls 3\u00d715', 'Lift: EZ-bar curls 3\u00d712', 'Lift: hammer curls 3\u00d712'],
    3: ['Warm-up: bike 3 min', 'Lift: barbell squats 4\u00d76', 'Lift: barbell RDL 3\u00d78', 'Lift: rear-foot-elevated split squat 3\u00d78/leg', 'Lift: calf raises on step 3\u00d715', 'Core: ab wheel 3\u00d710', 'Core: plank 3\u00d745 sec'],
    4: ['Run: C25K warm-up', 'Lift: landmine press 3\u00d710', 'Lift: DB press 3\u00d710', 'Lift: dip (bench) 3\u00d7submax', 'Lift: DB lateral raise 3\u00d715', 'Lift: EZ-bar skull crushers 3\u00d712', 'Band pull-aparts 3\u00d720'],
    5: ['Warm-up: jump rope 2 min', 'Lift: pull-ups 4\u00d7submax', 'Lift: barbell row 4\u00d78', 'Lift: DB row 3\u00d710', 'Lift: EZ-bar curls 3\u00d712', 'Lift: face pulls 3\u00d715', 'Finisher: jump rope 5 rounds'],
    6: ['Lift: goblet squats 3\u00d712', 'Lift: step-ups 3\u00d710/leg', 'Lift: kettlebell swings 3\u00d715', 'Core: ab wheel 3\u00d710', 'Core: Russian twists 3\u00d720', 'Conditioning: battle ropes 5 rounds', 'Conditioning: punching bag 3\u00d73 min'],
    0: ['Recovery: stretch / foam roll / easy walk']
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
      var o = JSON.parse(r), m = WT.cloneDefault();
      for (var d = 0; d <= 6; d++) {
        var k = String(d);
        if (Array.isArray(o[k]) && o[k].length) m[d] = o[k].map(String);
      }
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
      if (!r) return { goal: null, days: {} };
      var o = JSON.parse(r); return { goal: o.goal != null ? o.goal : null, days: o.days || {} };
    } catch (e) { return { goal: null, days: {} }; }
  };

  WT.saveMonth = function (y, m, d) {
    var mk = y + '-' + WT.pad(m + 1);
    localStorage.setItem(WT.STORAGE_PREFIX + mk, JSON.stringify(d));
    WT.fbSet('months/' + mk, d);
  };

  WT.ensureRec = function (md, id) {
    if (!md.days[id]) md.days[id] = { lift: false, run: false, p: '', foods: [], lifts: {} };
    var r = md.days[id];
    if (r.w !== undefined) { r.lift = !!r.w; delete r.w; }
    if (!r.foods) r.foods = [];
    if (!r.lifts) r.lifts = {};
    return r;
  };

  WT.syncGoal = function () {
    var gy = WT.viewMode === 'month' ? WT.view.y : WT.focus.y;
    var gm = WT.viewMode === 'month' ? WT.view.m : WT.focus.m;
    var d = WT.loadMonth(gy, gm);
    if (d.goal != null && !isNaN(d.goal)) WT.el.goal.value = String(d.goal);
  };

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
