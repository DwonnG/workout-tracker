(function () {
  var WT = window.WT;
  var foodModalEl, foodSearchInput, foodResultsEl;
  var manualNameEl, manualProteinEl, manualAddBtn;
  var lastUsda = [];

  function renderModalResults(local, usda) {
    foodResultsEl.innerHTML = '';
    var all = local.concat(usda || []);
    if (!all.length && foodSearchInput.value.trim().length >= 2) {
      foodResultsEl.innerHTML = '<div class="modal-hint">No results found</div>'; return;
    }
    if (!all.length) { foodResultsEl.innerHTML = '<div class="modal-hint">Type to search 40+ common foods + USDA database</div>'; return; }
    all.forEach(function (f) {
      var row = document.createElement('div'); row.className = 'modal-result';
      var nm = document.createElement('span'); nm.className = 'modal-result-name'; nm.textContent = f.name;
      var pg = document.createElement('span'); pg.className = 'modal-result-protein';
      pg.textContent = f.p + 'g' + (f.per ? ' / ' + f.per : '');
      if (f.src) { var s = document.createElement('span'); s.className = 'modal-result-src'; s.textContent = f.src; pg.appendChild(s); }
      row.appendChild(nm); row.appendChild(pg);
      row.addEventListener('click', function () {
        if (WT.activeFoodLog) WT.activeFoodLog.add(f.name, f.p);
        WT.closeFoodModal();
      });
      foodResultsEl.appendChild(row);
    });
  }

  WT.openFoodModal = function () { foodModalEl.classList.add('open'); setTimeout(function () { manualNameEl.focus(); }, 100); };

  WT.closeFoodModal = function () {
    foodModalEl.classList.remove('open'); foodSearchInput.value = '';
    manualNameEl.value = ''; manualProteinEl.value = ''; manualAddBtn.disabled = true;
    foodResultsEl.innerHTML = '<div class="modal-hint">Type to search 40+ common foods + USDA database</div>';
  };

  WT.initFoodModal = function () {
    foodModalEl = document.getElementById('foodModal');
    foodSearchInput = document.getElementById('foodSearchInput');
    foodResultsEl = document.getElementById('foodResults');
    manualNameEl = document.getElementById('manualFoodName');
    manualProteinEl = document.getElementById('manualFoodProtein');
    manualAddBtn = document.getElementById('manualFoodAdd');

    function updateManualBtn() {
      var name = manualNameEl.value.trim(), prot = parseInt(manualProteinEl.value, 10);
      manualAddBtn.disabled = !(name && prot > 0);
    }
    manualNameEl.addEventListener('input', updateManualBtn);
    manualProteinEl.addEventListener('input', updateManualBtn);

    function submitManualEntry() {
      var name = manualNameEl.value.trim(), prot = parseInt(manualProteinEl.value, 10) || 0;
      if (!name || prot <= 0) return;
      if (WT.activeFoodLog) WT.activeFoodLog.add(name, prot);
      WT.closeFoodModal();
    }
    manualAddBtn.addEventListener('click', submitManualEntry);
    manualProteinEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitManualEntry(); });
    manualNameEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { manualProteinEl.focus(); e.preventDefault(); } });

    document.getElementById('foodModalClose').addEventListener('click', WT.closeFoodModal);
    foodModalEl.addEventListener('click', function (e) { if (e.target === foodModalEl) WT.closeFoodModal(); });

    foodSearchInput.addEventListener('input', function () {
      var q = foodSearchInput.value.trim();
      if (q.length < 2) { lastUsda = []; renderModalResults([], []); return; }
      var local = WT.searchLocal(q);
      renderModalResults(local, lastUsda);
      WT.searchUSDA(q, function (usda) { lastUsda = usda; renderModalResults(WT.searchLocal(foodSearchInput.value.trim()), usda); });
    });
    foodSearchInput.addEventListener('keydown', function (e) { if (e.key === 'Escape') WT.closeFoodModal(); });
  };
})();
