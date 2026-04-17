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

  function renderFilters() {
    pickerFilters.innerHTML = '';
    var groups = ['all'].concat(WT.MUSCLE_GROUPS);
    groups.forEach(function (g) {
      var btn = document.createElement('button');
      btn.className = 'ep-filter' + (g === activeFilter ? ' active' : '');
      btn.textContent = g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1);
      btn.addEventListener('click', function () {
        activeFilter = g;
        renderFilters();
        renderPickerList(pickerSearch.value);
      });
      pickerFilters.appendChild(btn);
    });
  }

  function renderPickerList(query) {
    pickerList.innerHTML = '';
    var exercises;
    if (query && query.trim().length >= 2) {
      exercises = WT.searchExercises(query, 30);
    } else {
      exercises = WT.EXERCISE_DB.slice();
    }

    if (activeFilter !== 'all') {
      exercises = exercises.filter(function (ex) {
        return ex.muscles.indexOf(activeFilter) !== -1;
      });
    }

    if (!exercises.length) {
      var empty = document.createElement('div');
      empty.className = 'ep-empty';
      empty.textContent = 'No exercises found';
      pickerList.appendChild(empty);
      return;
    }

    exercises.forEach(function (ex) {
      var row = document.createElement('div');
      row.className = 'ep-row';

      var info = document.createElement('div');
      info.className = 'ep-row-info';
      var name = document.createElement('div');
      name.className = 'ep-row-name';
      name.textContent = ex.name;
      var muscles = document.createElement('div');
      muscles.className = 'ep-row-muscles';
      muscles.textContent = ex.muscles.join(' \u00b7 ');
      info.appendChild(name);
      info.appendChild(muscles);

      var addBtn = document.createElement('button');
      addBtn.className = 'ep-row-add';
      addBtn.textContent = '+';
      addBtn.setAttribute('aria-label', 'Add ' + ex.name);

      addBtn.addEventListener('click', function () {
        var scheme = ex.category === 'cardio' ? '20min' : '3\u00d710';
        var line = WT.formatExerciseLine(ex, scheme);
        if (pickerCallback) pickerCallback(line);
        WT.haptic('light');
      });

      row.appendChild(info);
      row.appendChild(addBtn);
      pickerList.appendChild(row);
    });
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
      if (pickerCallback) pickerCallback(line);
      pickerCustom.value = '';
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
    WT.DOW_ORDER.forEach(function (dow) {
      var card = document.createElement('div'); card.className = 'plan-day';
      var header = document.createElement('div'); header.className = 'plan-day-header';
      var lab = document.createElement('label'); lab.textContent = WT.DOW_LABEL[dow];
      var dt = WT.DAY_LABELS[dow] || { label: '', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
      var badge = document.createElement('span'); badge.className = 'plan-day-badge';
      badge.textContent = dt.label; badge.style.color = dt.color; badge.style.background = dt.bg;
      header.appendChild(lab); header.appendChild(badge); card.appendChild(header);

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
          text.textContent = line;

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
    });
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
          li.textContent = item.line; ssWrap.appendChild(li);
        });
        ul.appendChild(ssWrap);
      } else {
        var li = document.createElement('li'); li.className = WT.lineCategory(g.line);
        li.textContent = g.line; ul.appendChild(li);
      }
    });
    return ul;
  };
})();
