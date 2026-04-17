(function () {
  var WT = window.WT;
  var pickerModal, pickerSearch, pickerFilters, pickerList, pickerCustom, pickerCustomAdd;
  var activeFilter = 'all';
  var pickerCallback = null;

  function openPicker(cb) {
    pickerCallback = cb;
    activeFilter = 'all';
    pickerSearch.value = '';
    renderFilters();
    renderPickerList('');
    pickerModal.classList.add('open');
    setTimeout(function () { pickerSearch.focus(); }, 100);
  }

  function closePicker() {
    pickerModal.classList.remove('open');
    pickerCallback = null;
  }

  var CATEGORY_FILTERS = ['run', 'cardio', 'conditioning'];
  var CATEGORY_LABELS = { run: 'Run', cardio: 'Cardio', conditioning: 'Conditioning' };

  function renderFilters() {
    pickerFilters.innerHTML = '';
    var hasCustom = WT.loadCustomExercises().length > 0;
    var groups = ['all'];
    groups = groups.concat(CATEGORY_FILTERS);
    var catSet = {};
    CATEGORY_FILTERS.forEach(function (c) { catSet[c] = true; });
    WT.MUSCLE_GROUPS.forEach(function (g) { if (!catSet[g]) groups.push(g); });
    if (hasCustom) groups.push('custom');
    groups.forEach(function (g) {
      var btn = document.createElement('button');
      btn.className = 'ep-filter' + (g === activeFilter ? ' active' : '');
      btn.textContent = g === 'all' ? 'All' : g === 'custom' ? 'My Exercises' : (CATEGORY_LABELS[g] || g.charAt(0).toUpperCase() + g.slice(1));
      btn.addEventListener('click', function () {
        activeFilter = g;
        renderFilters();
        renderPickerList(pickerSearch.value);
      });
      pickerFilters.appendChild(btn);
    });
  }

  function isCustomExercise(ex) {
    var customs = WT.loadCustomExercises();
    return customs.some(function (c) { return c.name.toLowerCase() === ex.name.toLowerCase(); });
  }

  function renderPickerList(query) {
    pickerList.innerHTML = '';
    var exercises;
    if (query && query.trim().length >= 2) {
      exercises = WT.searchExercises(query, 30);
    } else {
      exercises = WT.allExercises();
    }

    if (activeFilter === 'custom') {
      var customs = WT.loadCustomExercises();
      var customNames = {};
      customs.forEach(function (c) { customNames[c.name.toLowerCase()] = true; });
      exercises = exercises.filter(function (ex) { return customNames[ex.name.toLowerCase()]; });
    } else if (CATEGORY_FILTERS.indexOf(activeFilter) !== -1) {
      exercises = exercises.filter(function (ex) { return ex.category === activeFilter; });
    } else if (activeFilter !== 'all') {
      exercises = exercises.filter(function (ex) {
        return ex.muscles.indexOf(activeFilter) !== -1;
      });
    }

    if (!exercises.length) {
      var empty = document.createElement('div');
      empty.className = 'ep-empty';
      empty.textContent = activeFilter === 'custom' ? 'No custom exercises yet' : 'No exercises found';
      pickerList.appendChild(empty);
      return;
    }

    exercises.forEach(function (ex) {
      var row = document.createElement('div');
      var custom = isCustomExercise(ex);
      row.className = 'ep-row' + (custom ? ' ep-custom' : '');

      var info = document.createElement('div');
      info.className = 'ep-row-info';
      var name = document.createElement('div');
      name.className = 'ep-row-name';
      name.textContent = ex.name;
      if (custom) {
        var tag = document.createElement('span');
        tag.className = 'ep-custom-tag';
        tag.textContent = 'custom';
        name.appendChild(tag);
      }
      var muscles = document.createElement('div');
      muscles.className = 'ep-row-muscles';
      muscles.textContent = ex.muscles.join(' \u00b7 ');
      info.appendChild(name);
      info.appendChild(muscles);

      var actions = document.createElement('div');
      actions.className = 'ep-row-actions';

      var addBtn = document.createElement('button');
      addBtn.className = 'ep-row-add';
      addBtn.textContent = '+';
      addBtn.setAttribute('aria-label', 'Add ' + ex.name);
      addBtn.addEventListener('click', function () {
        var line = WT.formatExerciseLine(ex);
        if (pickerCallback) pickerCallback(line);
        WT.haptic('light');
      });
      actions.appendChild(addBtn);

      if (custom) {
        var delBtn = document.createElement('button');
        delBtn.className = 'ep-row-del';
        delBtn.textContent = '\u00d7';
        delBtn.setAttribute('aria-label', 'Delete ' + ex.name);
        delBtn.addEventListener('click', function () {
          WT.removeCustomExercise(ex.name);
          renderFilters();
          renderPickerList(pickerSearch.value);
        });
        actions.appendChild(delBtn);
      }

      row.appendChild(info);
      row.appendChild(actions);
      pickerList.appendChild(row);
    });
  }

  function showCustomExerciseForm(name) {
    var overlay = document.createElement('div');
    overlay.className = 'custom-ex-overlay';

    var card = document.createElement('div');
    card.className = 'custom-ex-card';

    var heading = document.createElement('div');
    heading.className = 'custom-ex-heading';
    heading.textContent = 'Save Custom Exercise';

    var nameLabel = document.createElement('div');
    nameLabel.className = 'custom-ex-name';
    nameLabel.textContent = name;

    var catRow = document.createElement('div');
    catRow.className = 'custom-ex-field';
    var catLabel = document.createElement('label');
    catLabel.textContent = 'Category';
    var catSel = document.createElement('select');
    catSel.className = 'custom-ex-select';
    var catLabels = { lift: 'Lift', run: 'Run', cardio: 'Cardio', core: 'Core', conditioning: 'Conditioning' };
    ['lift', 'run', 'cardio', 'core', 'conditioning'].forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c; opt.textContent = catLabels[c] || c;
      catSel.appendChild(opt);
    });
    catRow.appendChild(catLabel); catRow.appendChild(catSel);

    var muscleRow = document.createElement('div');
    muscleRow.className = 'custom-ex-field';
    var muscleLabel = document.createElement('label');
    muscleLabel.textContent = 'Muscle Groups';
    var muscleWrap = document.createElement('div');
    muscleWrap.className = 'custom-ex-muscles';
    var selectedMuscles = {};
    WT.MUSCLE_GROUPS.forEach(function (g) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'custom-ex-muscle-chip';
      chip.textContent = g.charAt(0).toUpperCase() + g.slice(1);
      chip.addEventListener('click', function () {
        selectedMuscles[g] = !selectedMuscles[g];
        chip.classList.toggle('active', !!selectedMuscles[g]);
      });
      muscleWrap.appendChild(chip);
    });
    muscleRow.appendChild(muscleLabel); muscleRow.appendChild(muscleWrap);

    var actions = document.createElement('div');
    actions.className = 'custom-ex-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'custom-ex-save';
    saveBtn.textContent = 'Save & Add';
    saveBtn.addEventListener('click', function () {
      var muscles = WT.MUSCLE_GROUPS.filter(function (g) { return selectedMuscles[g]; });
      if (!muscles.length) muscles = [catSel.value === 'cardio' || catSel.value === 'run' ? 'cardio' : 'full body'];
      var ex = { name: name, muscles: muscles, category: catSel.value, custom: true };
      WT.addCustomExercise(ex);
      var line = WT.formatExerciseLine(ex);
      if (pickerCallback) pickerCallback(line);
      pickerCustom.value = '';
      overlay.remove();
      renderFilters();
      renderPickerList(pickerSearch.value);
    });

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'custom-ex-cancel';
    cancelBtn.textContent = 'Just Add Once';
    cancelBtn.addEventListener('click', function () {
      var cat = catSel.value;
      var muscles = WT.MUSCLE_GROUPS.filter(function (g) { return selectedMuscles[g]; });
      if (!muscles.length) muscles = [cat === 'cardio' || cat === 'run' ? 'cardio' : 'full body'];
      var ex = { name: name, muscles: muscles, category: cat };
      var line = WT.formatExerciseLine(ex);
      if (pickerCallback) pickerCallback(line);
      pickerCustom.value = '';
      overlay.remove();
    });

    actions.appendChild(saveBtn); actions.appendChild(cancelBtn);
    card.appendChild(heading);
    card.appendChild(nameLabel);
    card.appendChild(catRow);
    card.appendChild(muscleRow);
    card.appendChild(actions);
    overlay.appendChild(card);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  WT.initExercisePicker = function () {
    pickerModal = document.getElementById('exercisePickerModal');
    if (!pickerModal) return;
    pickerSearch = document.getElementById('exercisePickerSearch');
    pickerFilters = document.getElementById('exercisePickerFilters');
    pickerList = document.getElementById('exercisePickerList');
    pickerCustom = document.getElementById('exercisePickerCustom');
    pickerCustomAdd = document.getElementById('exercisePickerCustomAdd');

    document.getElementById('exercisePickerClose').addEventListener('click', closePicker);
    pickerModal.addEventListener('click', function (e) { if (e.target === pickerModal) closePicker(); });

    pickerSearch.addEventListener('input', function () {
      renderPickerList(pickerSearch.value);
    });

    pickerCustomAdd.addEventListener('click', function () {
      var line = pickerCustom.value.trim();
      if (!line) return;
      showCustomExerciseForm(line);
    });

    pickerCustom.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { pickerCustomAdd.click(); e.preventDefault(); }
    });
  };

  WT.openDayPicker = function (cb) {
    openPicker(function (line) {
      if (cb) cb(line);
      closePicker();
    });
  };

  WT.buildPlanFields = function () {
    var w = document.getElementById('planFields'); if (!w) return; w.innerHTML = '';
    var p = WT.loadPlan();
    var labels = WT.loadDayLabels();
    WT.DOW_ORDER.forEach(function (dow) {
      var card = document.createElement('div'); card.className = 'plan-day';
      var header = document.createElement('div'); header.className = 'plan-day-header';
      var lab = document.createElement('label'); lab.textContent = WT.DOW_LABEL[dow];

      var sel = document.createElement('select');
      sel.className = 'plan-type-select';
      sel.dataset.dow = String(dow);
      var current = labels[dow] || 'Rest';
      WT.WORKOUT_TYPE_NAMES.forEach(function (name) {
        var opt = document.createElement('option');
        opt.value = name; opt.textContent = name;
        if (name === current) opt.selected = true;
        sel.appendChild(opt);
      });
      var style = WT.WORKOUT_TYPES[current] || WT.WORKOUT_TYPES['Rest'];
      sel.style.color = style.color; sel.style.background = style.bg;
      sel.addEventListener('change', function () {
        var s = WT.WORKOUT_TYPES[sel.value] || WT.WORKOUT_TYPES['Rest'];
        sel.style.color = s.color; sel.style.background = s.bg;
      });

      header.appendChild(lab); header.appendChild(sel); card.appendChild(header);

      var exerciseList = document.createElement('div');
      exerciseList.className = 'plan-exercise-list';
      exerciseList.dataset.dow = String(dow);

      function renderExerciseItems() {
        exerciseList.innerHTML = '';
        var lines = p[dow] || [];
        lines.forEach(function (line, idx) {
          var item = document.createElement('div');
          item.className = 'plan-exercise-item ' + WT.lineCategory(line);
          item.setAttribute('draggable', 'true');
          item.dataset.idx = String(idx);

          var grip = document.createElement('span');
          grip.className = 'plan-ex-grip';
          grip.textContent = '\u2261';

          var text = document.createElement('span');
          text.className = 'plan-ex-text';
          text.textContent = WT.titleCase(line);

          var delBtn = document.createElement('button');
          delBtn.className = 'plan-ex-del';
          delBtn.textContent = '\u00d7';
          delBtn.setAttribute('aria-label', 'Remove exercise');
          delBtn.addEventListener('click', function () {
            lines.splice(idx, 1);
            renderExerciseItems();
          });

          item.appendChild(grip);
          item.appendChild(text);
          item.appendChild(delBtn);

          item.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', String(idx));
            item.classList.add('dragging');
          });
          item.addEventListener('dragend', function () { item.classList.remove('dragging'); });
          item.addEventListener('dragover', function (e) { e.preventDefault(); item.classList.add('drag-over'); });
          item.addEventListener('dragleave', function () { item.classList.remove('drag-over'); });
          item.addEventListener('drop', function (e) {
            e.preventDefault();
            item.classList.remove('drag-over');
            var fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            var toIdx = idx;
            if (fromIdx === toIdx) return;
            var moved = lines.splice(fromIdx, 1)[0];
            lines.splice(toIdx, 0, moved);
            renderExerciseItems();
          });

          exerciseList.appendChild(item);
        });
      }

      renderExerciseItems();

      var addBtn = document.createElement('button');
      addBtn.className = 'plan-add-exercise-btn';
      addBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Exercise';
      addBtn.addEventListener('click', function () {
        openPicker(function (line) {
          p[dow].push(line);
          renderExerciseItems();
        });
      });

      card.appendChild(exerciseList);
      card.appendChild(addBtn);
      w.appendChild(card);
    });
  };

  WT.readPlanForm = function () {
    var o = {};
    var labels = {};
    WT.DOW_ORDER.forEach(function (dow) {
      var list = document.querySelector('.plan-exercise-list[data-dow="' + dow + '"]');
      if (list) {
        var items = list.querySelectorAll('.plan-ex-text');
        var lines = [];
        for (var i = 0; i < items.length; i++) {
          var t = items[i].textContent.trim();
          if (t) lines.push(t);
        }
        o[dow] = lines.length ? lines : (WT.DEFAULT_PLAN[dow] || []).slice();
      } else {
        o[dow] = (WT.DEFAULT_PLAN[dow] || []).slice();
      }
      var sel = document.querySelector('.plan-type-select[data-dow="' + dow + '"]');
      labels[dow] = sel ? sel.value : (WT.DEFAULT_DAY_LABELS[dow] || 'Rest');
    });
    WT.saveDayLabels(labels);
    return o;
  };

  WT.buildPlanList = function (snap, dow, cls) {
    var ul = document.createElement('ul'); ul.className = 'day-plan' + (cls ? ' ' + cls : '');
    var planLines = WT.planLines(snap, dow);
    var groups = WT.groupSupersets(planLines);
    groups.forEach(function (g) {
      if (g.type === 'superset') {
        var ssWrap = document.createElement('div'); ssWrap.className = 'superset-group compact';
        g.items.forEach(function (item) {
          var li = document.createElement('li'); li.className = WT.lineCategory(item.line);
          li.textContent = WT.titleCase(item.line); ssWrap.appendChild(li);
        });
        ul.appendChild(ssWrap);
      } else {
        var li = document.createElement('li'); li.className = WT.lineCategory(g.line);
        li.textContent = WT.titleCase(g.line); ul.appendChild(li);
      }
    });
    return ul;
  };
})();
