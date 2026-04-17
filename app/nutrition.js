(function () {
  var WT = window.WT;
  var macroListEl, goalListEl, myFoodsListEl, formEl, nameInput, macroInputsWrap;
  var goalInputs = {};
  var macroInputs = {};
  var editingId = null;

  function renderMacroList() {
    macroListEl.innerHTML = '';
    WT.MACRO_ORDER.forEach(function (key) {
      var m = WT.MACROS[key];
      var checked = WT.isTracked(key);

      var row = document.createElement('label');
      row.className = 'settings-macro-row';

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = checked;
      cb.dataset.macro = key;
      cb.addEventListener('change', function () { renderGoalList(); });

      var dot = document.createElement('span');
      dot.className = 'settings-macro-dot';
      dot.style.background = m.color;

      var label = document.createElement('span');
      label.className = 'settings-macro-label';
      label.textContent = m.label;
      if (m.unit) label.textContent += ' (' + m.unit + ')';

      row.appendChild(cb);
      row.appendChild(dot);
      row.appendChild(label);
      macroListEl.appendChild(row);
    });
  }

  function getSelected() {
    var cbs = macroListEl.querySelectorAll('input[type="checkbox"]');
    var arr = [];
    for (var i = 0; i < cbs.length; i++) {
      if (cbs[i].checked) arr.push(cbs[i].dataset.macro);
    }
    return arr;
  }

  function renderGoalList() {
    goalListEl.innerHTML = '';
    goalInputs = {};
    var selected = getSelected();
    var gy = WT.viewMode === 'month' ? WT.view.y : WT.focus.y;
    var gm = WT.viewMode === 'month' ? WT.view.m : WT.focus.m;
    var md = WT.loadMonth(gy, gm);

    selected.forEach(function (key) {
      var m = WT.MACROS[key];
      var currentVal = WT.getGoal(md, key);

      var row = document.createElement('div');
      row.className = 'settings-goal-row';

      var dot = document.createElement('span');
      dot.className = 'settings-macro-dot';
      dot.style.background = m.color;

      var lbl = document.createElement('span');
      lbl.className = 'settings-goal-label';
      lbl.textContent = m.label;

      var inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'settings-goal-input';
      inp.min = '0';
      inp.max = key === 'sodium' ? '10000' : (key === 'cal' ? '10000' : '1000');
      inp.step = '1';
      inp.placeholder = '0';
      inp.setAttribute('aria-label', m.label + ' daily goal');
      if (currentVal) inp.value = String(currentVal);

      var unit = document.createElement('span');
      unit.className = 'settings-goal-unit';
      unit.textContent = m.unit || '';

      row.appendChild(dot);
      row.appendChild(lbl);
      row.appendChild(inp);
      if (m.unit) row.appendChild(unit);
      goalListEl.appendChild(row);
      goalInputs[key] = inp;
    });
  }

  function renderMyFoods() {
    myFoodsListEl.innerHTML = '';
    var foods = WT.loadCustomFoods();
    if (!foods.length) {
      myFoodsListEl.innerHTML = '<div class="my-food-empty">No saved foods yet. Add your frequently eaten foods here.</div>';
      return;
    }
    foods.forEach(function (f) {
      var card = document.createElement('div');
      card.className = 'my-food-card';

      var nm = document.createElement('span');
      nm.className = 'my-food-card-name';
      nm.textContent = f.name;

      var pills = document.createElement('span');
      pills.className = 'macro-pills';
      WT.trackedMacros.forEach(function (k) {
        var mac = WT.MACROS[k];
        var pill = document.createElement('span');
        pill.className = 'macro-pill';
        pill.style.color = mac.color;
        pill.textContent = mac.abbr + ' ' + (f[k] || 0) + (mac.unit || '');
        pills.appendChild(pill);
      });

      var editBtn = document.createElement('button');
      editBtn.className = 'my-food-card-btn';
      editBtn.innerHTML = '&#9998;';
      editBtn.title = 'Edit';
      editBtn.addEventListener('click', function () { openForm(f); });

      var delBtn = document.createElement('button');
      delBtn.className = 'my-food-card-btn del';
      delBtn.textContent = '\u00d7';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', function () {
        WT.deleteCustomFood(f.id);
        renderMyFoods();
      });

      card.appendChild(nm);
      card.appendChild(pills);
      card.appendChild(editBtn);
      card.appendChild(delBtn);
      myFoodsListEl.appendChild(card);
    });
  }

  function buildFormInputs() {
    macroInputsWrap.innerHTML = '';
    macroInputs = {};
    WT.MACRO_ORDER.forEach(function (key) {
      var m = WT.MACROS[key];
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'my-food-macro-input';
      inp.placeholder = m.abbr;
      inp.min = '0';
      inp.setAttribute('aria-label', m.label);
      inp.style.borderColor = m.color;
      macroInputsWrap.appendChild(inp);
      macroInputs[key] = inp;
    });
  }

  function openForm(food) {
    editingId = food ? food.id : null;
    formEl.style.display = '';
    document.getElementById('addMyFoodBtn').style.display = 'none';
    nameInput.value = food ? food.name : '';
    buildFormInputs();
    if (food) {
      WT.MACRO_ORDER.forEach(function (k) {
        if (food[k]) macroInputs[k].value = String(food[k]);
      });
    }
    nameInput.focus();
  }

  function closeForm() {
    formEl.style.display = 'none';
    document.getElementById('addMyFoodBtn').style.display = '';
    editingId = null;
  }

  function saveFormItem() {
    var name = nameInput.value.trim();
    if (!name) return;
    var item = { name: name };
    WT.MACRO_ORDER.forEach(function (k) {
      item[k] = macroInputs[k] ? (parseInt(macroInputs[k].value, 10) || 0) : 0;
    });
    if (editingId) {
      item.id = editingId;
      WT.updateCustomFood(item);
    } else {
      WT.addCustomFood(item);
    }
    closeForm();
    renderMyFoods();
  }

  function saveNutrition() {
    var selected = getSelected();
    WT.savePrefs(selected);

    var gy = WT.viewMode === 'month' ? WT.view.y : WT.focus.y;
    var gm = WT.viewMode === 'month' ? WT.view.m : WT.focus.m;
    var md = WT.loadMonth(gy, gm);

    selected.forEach(function (key) {
      if (!goalInputs[key]) return;
      var val = parseInt(goalInputs[key].value, 10) || 0;
      if (key === 'p') {
        md.goal = val;
      } else {
        if (!md.goals) md.goals = {};
        md.goals[key] = val;
      }
    });
    WT.saveMonth(gy, gm, md);

    if (WT.db && WT.fbRoot) {
      WT.fbSet('profile/trackedMacros', selected);
    }
    WT.render();
    var editorModal = document.getElementById('editorModal');
    if (editorModal) editorModal.classList.remove('open');
    WT.showToast('Nutrition saved', 'var(--green)');
  }

  WT.openNutritionTab = function () {
    renderMacroList();
    renderGoalList();
    renderMyFoods();
    closeForm();
  };

  WT.initNutrition = function () {
    macroListEl = document.getElementById('nutritionMacroList');
    goalListEl = document.getElementById('nutritionGoalList');
    myFoodsListEl = document.getElementById('myFoodsList');
    formEl = document.getElementById('myFoodForm');
    nameInput = document.getElementById('myFoodNameInput');
    macroInputsWrap = document.getElementById('myFoodMacroInputs');

    document.getElementById('addMyFoodBtn').addEventListener('click', function () { openForm(null); });
    document.getElementById('myFoodCancelBtn').addEventListener('click', closeForm);
    document.getElementById('myFoodSaveItemBtn').addEventListener('click', saveFormItem);
    document.getElementById('nutritionSaveBtn').addEventListener('click', saveNutrition);
  };
})();
