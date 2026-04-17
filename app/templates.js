(function () {
  var WT = window.WT;
  var STORAGE_KEY = 'wt:templates';
  var modalEl, listEl, nameInput, linesInput, saveBtn, deleteBtn;
  var editingId = null;

  function loadTemplates() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) { /* fallback */ }
    return [];
  }

  function saveTemplates(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    if (WT.db && WT.fbRoot) WT.fbSet('templates', arr);
  }

  WT.getTemplates = function () { return loadTemplates(); };

  WT.openTemplateModal = function (id) {
    if (!modalEl) return;
    var templates = loadTemplates();
    editingId = id || null;
    renderTemplateList(templates);

    if (editingId) {
      var t = templates.find(function (x) { return x.id === editingId; });
      if (t) {
        nameInput.value = t.name;
        linesInput.value = (t.lines || []).join('\n');
        deleteBtn.style.display = '';
      }
    } else {
      nameInput.value = '';
      linesInput.value = '';
      deleteBtn.style.display = 'none';
    }

    modalEl.classList.add('open');
  };

  function closeModal() { modalEl.classList.remove('open'); editingId = null; }

  function renderTemplateList(templates) {
    listEl.innerHTML = '';
    if (!templates.length) {
      var hint = document.createElement('div');
      hint.className = 'template-hint';
      hint.textContent = 'No templates yet. Create one below.';
      listEl.appendChild(hint);
      return;
    }
    templates.forEach(function (t) {
      var card = document.createElement('div'); card.className = 'template-card';
      var name = document.createElement('div'); name.className = 'template-card-name'; name.textContent = t.name;
      var info = document.createElement('div'); info.className = 'template-card-info';
      info.textContent = (t.lines || []).length + ' exercises';
      var actions = document.createElement('div'); actions.className = 'template-card-actions';

      var editBtn = document.createElement('button'); editBtn.className = 'template-action-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', function () { WT.openTemplateModal(t.id); });

      var useBtn = document.createElement('button'); useBtn.className = 'template-action-btn primary';
      useBtn.textContent = 'Use';
      useBtn.addEventListener('click', function () {
        WT.applyTemplate(t);
        closeModal();
      });

      actions.appendChild(editBtn); actions.appendChild(useBtn);
      card.appendChild(name); card.appendChild(info); card.appendChild(actions);
      listEl.appendChild(card);
    });
  }

  WT.applyTemplate = function (template) {
    var dow = new Date(WT.focus.y, WT.focus.m, WT.focus.d).getDay();
    var p = WT.loadPlan();
    p[dow] = (template.lines || []).slice();
    WT.savePlan(p);
    WT.render();
    WT.showToast('Applied "' + template.name + '"', 'var(--accent)');
  };

  WT.saveCurrentAsTemplate = function () {
    var dow = new Date(WT.focus.y, WT.focus.m, WT.focus.d).getDay();
    var snap = WT.loadPlan();
    var planLines = WT.planLines(snap, dow);
    if (!planLines.length || (planLines.length === 1 && planLines[0] === '\u2014')) {
      WT.showToast('No plan lines to save', 'var(--red)');
      return;
    }
    nameInput.value = WT.DOW_LABEL[dow] + ' Workout';
    linesInput.value = planLines.join('\n');
    editingId = null;
    deleteBtn.style.display = 'none';
    modalEl.classList.add('open');
  };

  WT.initTemplates = function () {
    modalEl = document.getElementById('templateModal');
    if (!modalEl) return;
    listEl = document.getElementById('templateList');
    nameInput = document.getElementById('templateName');
    linesInput = document.getElementById('templateLines');
    saveBtn = document.getElementById('templateSaveBtn');
    deleteBtn = document.getElementById('templateDeleteBtn');

    document.getElementById('templateModalClose').addEventListener('click', closeModal);
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) closeModal(); });

    saveBtn.addEventListener('click', function () {
      var name = nameInput.value.trim();
      if (!name) { WT.showToast('Template name required', 'var(--red)'); return; }
      var lines = linesInput.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!lines.length) { WT.showToast('Add at least one exercise', 'var(--red)'); return; }

      var templates = loadTemplates();
      if (editingId) {
        for (var i = 0; i < templates.length; i++) {
          if (templates[i].id === editingId) { templates[i].name = name; templates[i].lines = lines; break; }
        }
      } else {
        templates.push({ id: Date.now().toString(36), name: name, lines: lines });
      }
      saveTemplates(templates);
      closeModal();
      WT.showToast('Template saved', 'var(--green)');
    });

    deleteBtn.addEventListener('click', function () {
      if (!editingId) return;
      var templates = loadTemplates().filter(function (t) { return t.id !== editingId; });
      saveTemplates(templates);
      closeModal();
      WT.showToast('Template deleted', 'var(--text-muted)');
    });
  };
})();
