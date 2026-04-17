(function () {
  var WT = window.WT;
  var TOUR_KEY = 'wt:tourDone';
  var overlay, tooltip, stepNum, stepTotal, prevBtn, nextBtn, skipBtn;
  var currentStep = 0;

  var STEPS = [
    { sel: '.header-right', title: 'Date Navigation',      text: 'Use the arrows to switch days, weeks, or months. Tap "Today" to jump back.' },
    { sel: '#statsRow',     title: 'Weekly Stats',          text: 'Your weekly summary updates live -- lifts done, runs, volume, and nutrition averages.' },
    { sel: '#calendar',     title: 'Your Workout View',     text: 'This is your main view. Log sets, runs, food, and body metrics here.', maxH: 120 },
    { sel: '#editPlanBtn',  title: 'Edit Plan & Nutrition', text: 'Tap the pencil button to set up your weekly workout plan and configure nutrition tracking.' },
    { sel: '#bottomNav',    title: 'Switch Views',          text: 'Navigate between Day, Week, Month, and History views from here.' },
    { sel: '#settingsBtn',  title: 'Settings',              text: 'Access templates, data export, print, and clear functions in Settings.' }
  ];

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'tourOverlay';
    overlay.innerHTML =
      '<div class="tour-backdrop" id="tourBackdrop"></div>' +
      '<div class="tour-tooltip" id="tourTooltip">' +
        '<div class="tour-title" id="tourTitle"></div>' +
        '<div class="tour-text" id="tourText"></div>' +
        '<div class="tour-footer">' +
          '<span class="tour-counter" id="tourCounter"></span>' +
          '<div class="tour-btns">' +
            '<button class="tour-btn tour-skip" id="tourSkip">Skip</button>' +
            '<button class="tour-btn tour-prev" id="tourPrev">Back</button>' +
            '<button class="tour-btn tour-next" id="tourNext">Next</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    tooltip = document.getElementById('tourTooltip');
    stepNum = document.getElementById('tourCounter');
    prevBtn = document.getElementById('tourPrev');
    nextBtn = document.getElementById('tourNext');
    skipBtn = document.getElementById('tourSkip');

    skipBtn.addEventListener('click', endTour);
    prevBtn.addEventListener('click', function () { if (currentStep > 0) { currentStep--; showStep(); } });
    nextBtn.addEventListener('click', function () {
      if (currentStep < STEPS.length - 1) { currentStep++; showStep(); }
      else endTour();
    });
  }

  var GAP = 8;
  var PAD = 6;

  function layoutStep(el, step) {
    var raw = el.getBoundingClientRect();
    var vh = window.innerHeight;
    var vw = window.innerWidth;

    var r = {
      top: Math.max(0, raw.top),
      left: Math.max(0, raw.left),
      right: Math.min(vw, raw.right),
      bottom: step.maxH ? Math.min(raw.top + step.maxH, vh) : Math.min(raw.bottom, vh)
    };

    var backdrop = document.getElementById('tourBackdrop');
    backdrop.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9998;' +
      'box-shadow:0 0 0 9999px rgba(0,0,0,.65);' +
      'clip-path:polygon(0 0,100% 0,100% 100%,0 100%,' +
        '0 ' + (r.top - PAD) + 'px,' +
        (r.left - PAD) + 'px ' + (r.top - PAD) + 'px,' +
        (r.left - PAD) + 'px ' + (r.bottom + PAD) + 'px,' +
        (r.right + PAD) + 'px ' + (r.bottom + PAD) + 'px,' +
        (r.right + PAD) + 'px ' + (r.top - PAD) + 'px,' +
        '0 ' + (r.top - PAD) + 'px)';

    tooltip.style.cssText = 'position:fixed;visibility:hidden;z-index:9999;left:0;top:0;';
    var ttW = tooltip.offsetWidth;
    var ttH = tooltip.offsetHeight;

    var top = (vh - r.bottom > r.top)
      ? r.bottom + PAD + GAP
      : r.top - PAD - GAP - ttH;
    top = Math.max(8, Math.min(top, vh - ttH - 8));

    var left = (r.left + r.right) / 2 - ttW / 2;
    left = Math.max(8, Math.min(left, vw - ttW - 8));

    tooltip.style.cssText = 'position:fixed;top:' + top + 'px;left:' + left + 'px;z-index:9999;';
  }

  function showStep() {
    var step = STEPS[currentStep];
    var el = document.querySelector(step.sel);
    if (!el) { if (currentStep < STEPS.length - 1) { currentStep++; showStep(); } else endTour(); return; }

    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourText').textContent = step.text;
    stepNum.textContent = (currentStep + 1) + ' / ' + STEPS.length;
    prevBtn.style.display = currentStep === 0 ? 'none' : '';
    nextBtn.textContent = currentStep === STEPS.length - 1 ? 'Done' : 'Next';

    el.scrollIntoView({ block: 'nearest' });

    requestAnimationFrame(function () {
      layoutStep(el, step);
    });
  }

  function endTour() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) { /* noop */ }
  }

  WT.startTour = function () {
    currentStep = 0;
    if (!overlay) createOverlay();
    overlay.style.display = '';
    showStep();
  };

  WT.shouldShowTour = function () {
    try { return !localStorage.getItem(TOUR_KEY); } catch (e) { return false; }
  };
})();
