(function () {
  var WT = window.WT;
  var foodModalEl, foodSearchInput, foodResultsEl;
  var manualNameEl, manualAddBtn, manualMacroWrap;
  var manualInputs = {};
  var lastUsda = [];
  var savePromptEl = null;

  function closeSavePrompt() {
    if (savePromptEl) { savePromptEl.remove(); savePromptEl = null; }
  }

  function showSavePrompt(name, macros) {
    closeSavePrompt();
    var existing = WT.loadCustomFoods();
    var alreadySaved = existing.some(function (f) { return f.name.toLowerCase() === name.toLowerCase(); });
    if (alreadySaved) return;

    savePromptEl = document.createElement('div');
    savePromptEl.className = 'save-food-overlay';

    var card = document.createElement('div');
    card.className = 'save-food-card';

    var heading = document.createElement('div');
    heading.className = 'save-food-heading';
    heading.textContent = 'Save to My Foods?';

    var detail = document.createElement('div');
    detail.className = 'save-food-detail';
    detail.textContent = name;

    var actions = document.createElement('div');
    actions.className = 'save-food-actions';

    var btn = document.createElement('button');
    btn.className = 'save-food-yes';
    btn.textContent = 'Save';
    btn.addEventListener('click', function () {
      var item = { name: name };
      WT.MACRO_ORDER.forEach(function (k) { item[k] = macros[k] || 0; });
      WT.addCustomFood(item);
      closeSavePrompt();
      WT.showToast('Saved to My Foods', 'var(--green)');
    });

    var dismiss = document.createElement('button');
    dismiss.className = 'save-food-no';
    dismiss.textContent = 'No Thanks';
    dismiss.addEventListener('click', closeSavePrompt);

    actions.appendChild(btn);
    actions.appendChild(dismiss);
    card.appendChild(heading);
    card.appendChild(detail);
    card.appendChild(actions);
    savePromptEl.appendChild(card);

    savePromptEl.addEventListener('click', function (e) {
      if (e.target === savePromptEl) closeSavePrompt();
    });

    document.body.appendChild(savePromptEl);
    setTimeout(closeSavePrompt, 10000);
  }

  function buildManualInputs() {
    manualMacroWrap.innerHTML = '';
    manualInputs = {};
    WT.trackedMacros.forEach(function (key) {
      var m = WT.MACROS[key];
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'manual-macro-input';
      inp.placeholder = m.abbr;
      inp.min = '0';
      inp.setAttribute('aria-label', m.label);
      inp.style.borderColor = m.color;
      inp.addEventListener('input', updateManualBtn);
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submitManualEntry();
      });
      manualMacroWrap.appendChild(inp);
      manualInputs[key] = inp;
    });
  }

  function buildMacroPills(food) {
    var wrap = document.createElement('span');
    wrap.className = 'macro-pills';
    WT.trackedMacros.forEach(function (key) {
      var m = WT.MACROS[key];
      var pill = document.createElement('span');
      pill.className = 'macro-pill';
      pill.style.color = m.color;
      pill.style.background = m.color.indexOf('var(') === 0
        ? 'rgba(255,255,255,0.06)' : m.color + '20';
      var val = WT.macroVal(food, key);
      pill.textContent = m.abbr + ' ' + val + (m.unit || '');
      wrap.appendChild(pill);
    });
    return wrap;
  }

  function renderModalResults(local, usda) {
    foodResultsEl.innerHTML = '';
    var all = local.concat(usda || []);
    if (!all.length && foodSearchInput.value.trim().length >= 2) {
      foodResultsEl.innerHTML = '<div class="modal-hint">No results found</div>'; return;
    }
    if (!all.length) { foodResultsEl.innerHTML = ''; return; }
    all.forEach(function (f) {
      var row = document.createElement('div'); row.className = 'modal-result';
      var nm = document.createElement('span'); nm.className = 'modal-result-name'; nm.textContent = f.name;
      row.appendChild(nm);
      row.appendChild(buildMacroPills(f));
      if (f.src) {
        var s = document.createElement('span'); s.className = 'modal-result-src'; s.textContent = f.src;
        row.appendChild(s);
      }
      row.addEventListener('click', function () {
        var macros = {};
        WT.MACRO_ORDER.forEach(function (k) { macros[k] = WT.macroVal(f, k); });
        if (WT.activeFoodLog) WT.activeFoodLog.add(f.name, macros);
        WT.closeFoodModal();
        showSavePrompt(f.name, macros);
      });
      foodResultsEl.appendChild(row);
    });
  }

  WT.openFoodModal = function () {
    buildManualInputs();
    foodModalEl.classList.add('open');
    setTimeout(function () { manualNameEl.focus(); }, 100);
  };

  WT.closeFoodModal = function () {};

  function updateManualBtn() {
    var name = manualNameEl.value.trim();
    var hasValue = false;
    Object.keys(manualInputs).forEach(function (k) {
      var v = parseInt(manualInputs[k].value, 10);
      if (v > 0) hasValue = true;
    });
    manualAddBtn.disabled = !(name && hasValue);
  }

  function submitManualEntry() {
    var name = manualNameEl.value.trim();
    var macros = {};
    var hasValue = false;
    WT.MACRO_ORDER.forEach(function (k) {
      macros[k] = manualInputs[k] ? (parseInt(manualInputs[k].value, 10) || 0) : 0;
      if (macros[k] > 0) hasValue = true;
    });
    if (!name || !hasValue) return;
    if (WT.activeFoodLog) WT.activeFoodLog.add(name, macros);
    WT.closeFoodModal();
    showSavePrompt(name, macros);
  }

  var scannerWrap, scannerStatus, scannerViewfinder, scanRow;
  var scanning = false;

  function showScanButton() {
    if (!scanRow) return;
    if (typeof Quagga === 'undefined') { scanRow.style.display = 'none'; return; }
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      scanRow.style.display = 'none'; return;
    }
    scanRow.style.display = '';
  }

  function stopScanner() {
    if (!scanning) return;
    scanning = false;
    try { Quagga.stop(); } catch (e) { /* already stopped */ }
    scannerWrap.style.display = 'none';
    scannerViewfinder.innerHTML = '';
    scanRow.style.display = '';
  }

  function onBarcodeDetected(result) {
    if (!scanning) return;
    var code = result && result.codeResult && result.codeResult.code;
    if (!code || !/^\d{8,13}$/.test(code)) return;

    stopScanner();
    scannerWrap.style.display = '';
    scanRow.style.display = 'none';
    scannerStatus.textContent = 'Looking up ' + code + '...';
    scannerStatus.className = 'scanner-status';
    scannerViewfinder.innerHTML = '';

    WT.lookupBarcode(code, function (food, err) {
      if (err || !food) {
        scannerStatus.textContent = err || 'Product not found';
        scannerStatus.className = 'scanner-status error';
        setTimeout(function () { scannerWrap.style.display = 'none'; showScanButton(); }, 2500);
        return;
      }
      scannerStatus.textContent = food.name;
      scannerStatus.className = 'scanner-status success';

      var macros = {};
      WT.MACRO_ORDER.forEach(function (k) { macros[k] = food[k] || 0; });
      if (WT.activeFoodLog) WT.activeFoodLog.add(food.name, macros);
      showSavePrompt(food.name, macros);

      setTimeout(function () {
        scannerWrap.style.display = 'none';
        showScanButton();
        WT.closeFoodModal();
      }, 1200);
    });
  }

  function startScanner() {
    if (typeof Quagga === 'undefined') {
      WT.showToast('Scanner not available', 'var(--red)'); return;
    }
    scanRow.style.display = 'none';
    scannerWrap.style.display = '';
    scannerStatus.textContent = 'Starting camera...';
    scannerStatus.className = 'scanner-status';
    scannerViewfinder.innerHTML = '';

    var facingMode = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'environment' : 'user';

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerViewfinder,
        constraints: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } }
      },
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader']
      },
      locate: true,
      frequency: 10
    }, function (err) {
      if (err) {
        var msg = 'Camera unavailable';
        if (err.name === 'NotAllowedError') msg = 'Camera permission denied';
        else if (err.name === 'NotFoundError') msg = 'No camera found';
        scannerStatus.textContent = msg;
        scannerStatus.className = 'scanner-status error';
        setTimeout(function () { scannerWrap.style.display = 'none'; showScanButton(); }, 2500);
        return;
      }
      scanning = true;
      scannerStatus.textContent = 'Point camera at barcode...';
      Quagga.start();
    });

    Quagga.offDetected(onBarcodeDetected);
    Quagga.onDetected(onBarcodeDetected);
  }

  WT.initFoodModal = function () {
    foodModalEl = document.getElementById('foodModal');
    foodSearchInput = document.getElementById('foodSearchInput');
    foodResultsEl = document.getElementById('foodResults');
    manualNameEl = document.getElementById('manualFoodName');
    manualAddBtn = document.getElementById('manualFoodAdd');
    manualMacroWrap = document.getElementById('manualMacroInputs');

    scanRow = document.getElementById('scanRow');
    scannerWrap = document.getElementById('scannerWrap');
    scannerStatus = document.getElementById('scannerStatus');
    scannerViewfinder = document.getElementById('scannerViewfinder');

    manualNameEl.addEventListener('input', updateManualBtn);

    manualAddBtn.addEventListener('click', submitManualEntry);
    manualNameEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var firstInput = manualInputs[WT.trackedMacros[0]];
        if (firstInput) firstInput.focus();
        e.preventDefault();
      }
    });

    WT.closeFoodModal = function () {
      stopScanner();
      foodModalEl.classList.remove('open'); foodSearchInput.value = '';
      manualNameEl.value = '';
      Object.keys(manualInputs).forEach(function (k) { manualInputs[k].value = ''; });
      manualAddBtn.disabled = true;
      foodResultsEl.innerHTML = '';
      if (scannerWrap) scannerWrap.style.display = 'none';
      showScanButton();
    };

    document.getElementById('foodModalClose').addEventListener('click', function () { WT.closeFoodModal(); });
    foodModalEl.addEventListener('click', function (e) { if (e.target === foodModalEl) WT.closeFoodModal(); });

    document.getElementById('scanBarcodeBtn').addEventListener('click', startScanner);
    document.getElementById('scannerCancel').addEventListener('click', function () {
      stopScanner();
      showScanButton();
    });

    foodSearchInput.addEventListener('input', function () {
      var q = foodSearchInput.value.trim();
      if (q.length < 2) { lastUsda = []; renderModalResults([], []); return; }
      var local = WT.searchLocal(q);
      renderModalResults(local, lastUsda);
      WT.searchUSDA(q, function (usda) { lastUsda = usda; renderModalResults(WT.searchLocal(foodSearchInput.value.trim()), usda); });
    });
    foodSearchInput.addEventListener('keydown', function (e) { if (e.key === 'Escape') WT.closeFoodModal(); });

    showScanButton();
  };
})();
