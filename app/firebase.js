(function () {
  var WT = window.WT;
  var _fbDb = null;

  WT.getFirebaseDb = function () {
    if (_fbDb) return _fbDb;
    var firebaseConfig = {
      apiKey: 'AIzaSyA06BbTw9Ut-VciQRY9kN-gs-nTWwdD5NY',
      authDomain: 'workout-tracker-d6805.firebaseapp.com',
      databaseURL: 'https://workout-tracker-d6805-default-rtdb.firebaseio.com',
      projectId: 'workout-tracker-d6805',
      storageBucket: 'workout-tracker-d6805.firebasestorage.app',
      messagingSenderId: '1063554175055',
      appId: '1:1063554175055:web:ab748f62bb8898422cda3a'
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    _fbDb = firebase.database();
    return _fbDb;
  };

  WT.fbSet = function (path, val) {
    if (!WT.el.syncDot) return;
    WT.el.syncDot.className = 'sync-dot syncing'; WT.el.syncDot.title = 'Syncing\u2026';
    WT.db.ref(WT.fbRoot + '/' + path).set(val).then(function () {
      WT.el.syncDot.className = 'sync-dot'; WT.el.syncDot.title = 'Synced';
    }).catch(function () {
      WT.el.syncDot.className = 'sync-dot offline'; WT.el.syncDot.title = 'Sync failed';
    });
  };

  WT.applyFirebaseData = function (data) {
    if (data.plan) {
      var p = {};
      for (var d = 0; d <= 6; d++) {
        var k = String(d);
        p[d] = Array.isArray(data.plan[k]) ? data.plan[k].map(String) : (WT.DEFAULT_PLAN[d] || []).slice();
      }
      localStorage.setItem(WT.PLAN_KEY, JSON.stringify(p));
    }
    if (data.months) {
      var keys = Object.keys(data.months);
      for (var i = 0; i < keys.length; i++) {
        var monthData = data.months[keys[i]];
        if (monthData && monthData.days) {
          var dayKeys = Object.keys(monthData.days);
          for (var j = 0; j < dayKeys.length; j++) {
            var day = monthData.days[dayKeys[j]];
            if (day) {
              if (day.foods) day.foods = WT.toArray(day.foods);
              if (day.lifts) {
                var lk = Object.keys(day.lifts);
                for (var li = 0; li < lk.length; li++) {
                  if (day.lifts[lk[li]] && day.lifts[lk[li]].sets) {
                    day.lifts[lk[li]].sets = WT.toArray(day.lifts[lk[li]].sets);
                  }
                }
              }
            }
          }
        }
        localStorage.setItem(WT.STORAGE_PREFIX + keys[i], JSON.stringify(monthData));
      }
    }
    if (data.profile && data.profile.trackedMacros && Array.isArray(data.profile.trackedMacros)) {
      WT.savePrefs(data.profile.trackedMacros);
      if (WT.renderGoalInputs) WT.renderGoalInputs();
    }
    if (data.customFoods) {
      var cf = WT.toArray(data.customFoods);
      localStorage.setItem('wt:customFoods', JSON.stringify(cf));
    }
    if (data.dayLabels) {
      localStorage.setItem(WT.DAY_LABELS_KEY, JSON.stringify(data.dayLabels));
    }
    if (data.customExercises) {
      var ce = WT.toArray(data.customExercises);
      localStorage.setItem('wt:customExercises', JSON.stringify(ce));
    }
  };

  WT.pushAllToFirebase = function () {
    var data = { plan: WT.loadPlan(), months: {} };
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(WT.STORAGE_PREFIX) === 0) {
        var mk = k.slice(WT.STORAGE_PREFIX.length);
        try { data.months[mk] = JSON.parse(localStorage.getItem(k)); } catch (e) { /* skip corrupt entries */ }
      }
    }
    try { var cf = JSON.parse(localStorage.getItem('wt:customFoods')); if (cf) data.customFoods = cf; } catch (e) { /* skip */ }
    try { var dl = JSON.parse(localStorage.getItem(WT.DAY_LABELS_KEY)); if (dl) data.dayLabels = dl; } catch (e) { /* skip */ }
    try { var ce = JSON.parse(localStorage.getItem('wt:customExercises')); if (ce) data.customExercises = ce; } catch (e) { /* skip */ }
    WT.db.ref(WT.fbRoot).set(data);
  };

  WT.pullFromFirebase = function () {
    WT.db.ref(WT.fbRoot).once('value').then(function (snap) {
      var data = snap.val();
      if (!data) { WT.pushAllToFirebase(); return; }
      WT.applyFirebaseData(data);
      WT.buildPlanFields(); WT.render();
      WT.el.syncDot.className = 'sync-dot'; WT.el.syncDot.title = 'Synced';
    }).catch(function () {
      WT.el.syncDot.className = 'sync-dot offline'; WT.el.syncDot.title = 'Offline';
    });
  };
})();
