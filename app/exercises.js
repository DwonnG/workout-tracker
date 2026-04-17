(function () {
  var WT = window.WT;

  WT.MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'forearms', 'cardio', 'full body'];

  WT.EXERCISE_DB = [
    { name: 'Bench Press', muscles: ['chest', 'triceps', 'shoulders'], category: 'lift' },
    { name: 'Incline DB Press', muscles: ['chest', 'shoulders'], category: 'lift' },
    { name: 'Decline Bench Press', muscles: ['chest', 'triceps'], category: 'lift' },
    { name: 'DB Fly', muscles: ['chest'], category: 'lift' },
    { name: 'Cable Crossover', muscles: ['chest'], category: 'lift' },
    { name: 'Push-Up', muscles: ['chest', 'triceps', 'core'], category: 'lift' },
    { name: 'Barbell Row', muscles: ['back', 'biceps'], category: 'lift' },
    { name: 'DB Row', muscles: ['back', 'biceps'], category: 'lift' },
    { name: 'Landmine Row', muscles: ['back', 'biceps'], category: 'lift' },
    { name: 'Pull-Up', muscles: ['back', 'biceps'], category: 'lift' },
    { name: 'Band-Assisted Pull-Up', muscles: ['back', 'biceps'], category: 'lift' },
    { name: 'Lat Pulldown', muscles: ['back', 'biceps'], category: 'lift' },
    { name: 'Seated Cable Row', muscles: ['back'], category: 'lift' },
    { name: 'T-Bar Row', muscles: ['back'], category: 'lift' },
    { name: 'Face Pull', muscles: ['shoulders', 'back'], category: 'lift' },
    { name: 'Shoulder Press', muscles: ['shoulders', 'triceps'], category: 'lift' },
    { name: 'Landmine Press', muscles: ['shoulders', 'chest'], category: 'lift' },
    { name: 'Lateral Raise', muscles: ['shoulders'], category: 'lift' },
    { name: 'Front Raise', muscles: ['shoulders'], category: 'lift' },
    { name: 'Rear Delt Fly', muscles: ['shoulders', 'back'], category: 'lift' },
    { name: 'Arnold Press', muscles: ['shoulders', 'triceps'], category: 'lift' },
    { name: 'Band Pull-Apart', muscles: ['shoulders', 'back'], category: 'lift' },
    { name: 'Barbell Curl', muscles: ['biceps'], category: 'lift' },
    { name: 'EZ-Bar Curl', muscles: ['biceps'], category: 'lift' },
    { name: 'Hammer Curl', muscles: ['biceps', 'forearms'], category: 'lift' },
    { name: 'Preacher Curl', muscles: ['biceps'], category: 'lift' },
    { name: 'Concentration Curl', muscles: ['biceps'], category: 'lift' },
    { name: 'EZ-Bar Skull Crusher', muscles: ['triceps'], category: 'lift' },
    { name: 'Tricep Pushdown', muscles: ['triceps'], category: 'lift' },
    { name: 'Overhead Tricep Extension', muscles: ['triceps'], category: 'lift' },
    { name: 'Dip', muscles: ['triceps', 'chest'], category: 'lift' },
    { name: 'Close-Grip Bench Press', muscles: ['triceps', 'chest'], category: 'lift' },
    { name: 'Barbell Squat', muscles: ['quads', 'glutes', 'core'], category: 'lift' },
    { name: 'Front Squat', muscles: ['quads', 'core'], category: 'lift' },
    { name: 'Goblet Squat', muscles: ['quads', 'glutes'], category: 'lift' },
    { name: 'Leg Press', muscles: ['quads', 'glutes'], category: 'lift' },
    { name: 'Leg Extension', muscles: ['quads'], category: 'lift' },
    { name: 'Lunge', muscles: ['quads', 'glutes'], category: 'lift' },
    { name: 'Bulgarian Split Squat', muscles: ['quads', 'glutes'], category: 'lift' },
    { name: 'Rear-Foot-Elevated Split Squat', muscles: ['quads', 'glutes'], category: 'lift' },
    { name: 'Step-Up', muscles: ['quads', 'glutes'], category: 'lift' },
    { name: 'Barbell RDL', muscles: ['hamstrings', 'glutes', 'back'], category: 'lift' },
    { name: 'DB RDL', muscles: ['hamstrings', 'glutes'], category: 'lift' },
    { name: 'Leg Curl', muscles: ['hamstrings'], category: 'lift' },
    { name: 'Hip Thrust', muscles: ['glutes', 'hamstrings'], category: 'lift' },
    { name: 'Calf Raise', muscles: ['calves'], category: 'lift' },
    { name: 'Kettlebell Swing', muscles: ['glutes', 'hamstrings', 'core'], category: 'lift' },
    { name: 'Deadlift', muscles: ['back', 'glutes', 'hamstrings', 'core'], category: 'lift' },
    { name: 'Ab Wheel', muscles: ['core'], category: 'core' },
    { name: 'Plank', muscles: ['core'], category: 'core' },
    { name: 'Russian Twist', muscles: ['core'], category: 'core' },
    { name: 'Hanging Leg Raise', muscles: ['core'], category: 'core' },
    { name: 'Cable Crunch', muscles: ['core'], category: 'core' },
    { name: 'Farmer Walk', muscles: ['forearms', 'core', 'shoulders'], category: 'lift' },
    { name: 'Battle Ropes', muscles: ['full body'], category: 'conditioning' },
    { name: 'Jump Rope', muscles: ['calves', 'cardio'], category: 'conditioning' },
    { name: 'Punching Bag', muscles: ['full body'], category: 'conditioning' },

    { name: 'Treadmill Run', muscles: ['cardio', 'quads', 'calves'], category: 'cardio' },
    { name: 'Treadmill Walk (Incline)', muscles: ['cardio', 'glutes', 'calves'], category: 'cardio' },
    { name: 'Stationary Bike', muscles: ['cardio', 'quads'], category: 'cardio' },
    { name: 'Assault Bike', muscles: ['cardio', 'full body'], category: 'cardio' },
    { name: 'Rowing Machine', muscles: ['cardio', 'back', 'core'], category: 'cardio' },
    { name: 'Stair Climber', muscles: ['cardio', 'glutes', 'quads'], category: 'cardio' },
    { name: 'Elliptical', muscles: ['cardio', 'full body'], category: 'cardio' },
    { name: 'Swimming', muscles: ['cardio', 'full body'], category: 'cardio' },
    { name: 'Outdoor Run', muscles: ['cardio', 'quads', 'calves'], category: 'cardio' },
    { name: 'Sprint Intervals', muscles: ['cardio', 'quads', 'hamstrings'], category: 'cardio' },
    { name: 'Hill Sprints', muscles: ['cardio', 'glutes', 'quads'], category: 'cardio' },
    { name: 'Sled Push', muscles: ['cardio', 'quads', 'glutes', 'core'], category: 'cardio' },
    { name: 'Sled Pull', muscles: ['cardio', 'back', 'hamstrings'], category: 'cardio' },
    { name: 'Box Jumps', muscles: ['cardio', 'quads', 'glutes'], category: 'cardio' },
    { name: 'Burpees', muscles: ['cardio', 'full body'], category: 'cardio' },
    { name: 'Mountain Climbers', muscles: ['cardio', 'core', 'shoulders'], category: 'cardio' },
    { name: 'High Knees', muscles: ['cardio', 'quads', 'core'], category: 'cardio' },
    { name: 'Jump Squats', muscles: ['cardio', 'quads', 'glutes'], category: 'cardio' },
    { name: 'Kettlebell Snatch', muscles: ['cardio', 'shoulders', 'glutes'], category: 'cardio' },
    { name: 'Thrusters', muscles: ['cardio', 'quads', 'shoulders'], category: 'cardio' },
    { name: 'Wall Balls', muscles: ['cardio', 'quads', 'shoulders'], category: 'cardio' },
    { name: 'Man Makers', muscles: ['cardio', 'full body'], category: 'cardio' },
    { name: 'Bear Crawl', muscles: ['cardio', 'core', 'shoulders'], category: 'cardio' },
    { name: 'Ski Erg', muscles: ['cardio', 'back', 'core'], category: 'cardio' },
    { name: 'AMRAP Circuit', muscles: ['cardio', 'full body'], category: 'cardio' },
    { name: 'EMOM Circuit', muscles: ['cardio', 'full body'], category: 'cardio' },
    { name: 'Tabata Intervals', muscles: ['cardio', 'full body'], category: 'cardio' }
  ];

  var searchIndex = null;
  function buildIndex() {
    if (searchIndex) return;
    searchIndex = WT.EXERCISE_DB.map(function (ex) {
      return {
        ex: ex,
        tokens: (ex.name + ' ' + ex.muscles.join(' ')).toLowerCase().split(/\s+/)
      };
    });
  }

  WT.searchExercises = function (query, limit) {
    buildIndex();
    if (!query || !query.trim()) return WT.EXERCISE_DB.slice(0, limit || 10);
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    var scored = [];
    for (var i = 0; i < searchIndex.length; i++) {
      var entry = searchIndex[i], score = 0;
      for (var t = 0; t < terms.length; t++) {
        var matched = false;
        for (var k = 0; k < entry.tokens.length; k++) {
          if (entry.tokens[k].indexOf(terms[t]) === 0) { score += 2; matched = true; break; }
          else if (entry.tokens[k].indexOf(terms[t]) >= 0) { score += 1; matched = true; break; }
        }
        if (!matched) { score = -1; break; }
      }
      if (score > 0) scored.push({ ex: entry.ex, score: score });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, limit || 10).map(function (s) { return s.ex; });
  };

  WT.exercisePrefix = function (ex) {
    if (ex.category === 'core') return 'Core: ';
    if (ex.category === 'conditioning') return 'Conditioning: ';
    if (ex.category === 'cardio') return 'Cardio: ';
    return 'Lift: ';
  };

  WT.formatExerciseLine = function (ex, scheme) {
    var defaultScheme = scheme;
    if (!defaultScheme && ex.category === 'cardio') defaultScheme = '20min';
    else if (!defaultScheme) defaultScheme = '3\u00d710';
    if (ex.category === 'cardio' && scheme === '3\u00d710') defaultScheme = '20min';
    return WT.exercisePrefix(ex) + ex.name.toLowerCase() + ' ' + defaultScheme;
  };
})();
