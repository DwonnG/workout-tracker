(function () {
  var WT = window.WT;
  var PIN_HASH_KEY = 'wt:pinHash';
  var ACCOUNTS_KEY = 'wt:accounts';
  var USERNAME_KEY = 'wt:userName';
  var INVITE_HASH = '4c39c3f3adb26db03b31e70a59fd141af7585e59b30e0c7054f07c317dbced1d';
  var PBKDF2_ITERATIONS = 100000;

  var pinOverlay = document.getElementById('pinOverlay');
  var appWrap = document.getElementById('appWrap');
  var pinDotsEl = document.getElementById('pinDots');
  var pinErrorEl = document.getElementById('pinError');
  var pinSubtitle = document.getElementById('pinSubtitle');
  var pinToggleEl = document.getElementById('pinToggle');
  var pinInviteWrap = document.getElementById('pinInviteWrap');
  var pinInviteInput = document.getElementById('pinInviteInput');
  var pinInviteBtn = document.getElementById('pinInviteBtn');
  var pinNameWrap = document.getElementById('pinNameWrap');
  var pinNameInput = document.getElementById('pinNameInput');
  var pinNameBtn = document.getElementById('pinNameBtn');
  var numPadEl = document.getElementById('numPad');
  var userGreeting = document.getElementById('userGreeting');

  var enteredPin = '';
  var pinMaxLen = 6;
  var pinSubmitting = false;
  var pinMode = 'login';
  var createFirstPin = '';
  var createName = '';

  function getAccounts() {
    try {
      var raw = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
      if (raw.length > 0 && typeof raw[0] === 'string') return raw.map(function (h) { return { hash: h, name: '' }; });
      return raw;
    } catch (e) { return []; }
  }

  function findAccount(hash) {
    var accts = getAccounts();
    for (var i = 0; i < accts.length; i++) { if (accts[i].hash === hash) return accts[i]; }
    return null;
  }

  function saveAccount(hash, name) {
    var accts = getAccounts(), existing = false;
    for (var i = 0; i < accts.length; i++) { if (accts[i].hash === hash) { accts[i].name = name; existing = true; break; } }
    if (!existing) accts.push({ hash: hash, name: name });
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accts));
  }

  function setGreeting(name) {
    if (userGreeting) userGreeting.textContent = name ? ('Hi, ' + name) : '';
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }

  function renderNumPad() {
    var nums = shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    numPadEl.innerHTML = '';
    for (var r = 0; r < 3; r++) {
      var row = document.createElement('div'); row.className = 'num-row';
      for (var c = 0; c < 3; c++) {
        var n = nums[r * 3 + c];
        var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'num-btn'; btn.textContent = n;
        btn.addEventListener('click', (function (d) { return function () { addPinDigit(d); }; })(n));
        row.appendChild(btn);
      }
      numPadEl.appendChild(row);
    }
    var bottom = document.createElement('div'); bottom.className = 'num-row';
    var clearBtn = document.createElement('button'); clearBtn.type = 'button'; clearBtn.className = 'num-btn action clear';
    clearBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    clearBtn.addEventListener('click', clearPinEntry);
    var zeroBtn = document.createElement('button'); zeroBtn.type = 'button'; zeroBtn.className = 'num-btn'; zeroBtn.textContent = '0';
    zeroBtn.addEventListener('click', function () { addPinDigit('0'); });
    var bkBtn = document.createElement('button'); bkBtn.type = 'button'; bkBtn.className = 'num-btn action';
    bkBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"/></svg>';
    bkBtn.addEventListener('click', backspacePin);
    bottom.appendChild(clearBtn); bottom.appendChild(zeroBtn); bottom.appendChild(bkBtn);
    numPadEl.appendChild(bottom);
  }

  function updatePinUI() {
    var showPad = true, showDots = true, showToggle = true;
    pinInviteWrap.style.display = 'none';
    pinNameWrap.style.display = 'none';
    if (pinMode === 'invite') {
      pinSubtitle.textContent = 'Enter your invite code';
      pinInviteWrap.style.display = ''; pinInviteInput.value = '';
      showPad = false; showDots = false; showToggle = false;
      setTimeout(function () { pinInviteInput.focus(); }, 100);
    } else if (pinMode === 'name') {
      pinSubtitle.textContent = "What's your name?";
      pinNameWrap.style.display = ''; pinNameInput.value = '';
      showPad = false; showDots = false; showToggle = false;
      setTimeout(function () { pinNameInput.focus(); }, 100);
    } else {
      if (pinMode === 'create') {
        pinSubtitle.textContent = createFirstPin ? 'Confirm your PIN' : 'Choose a 6-digit PIN';
        pinToggleEl.innerHTML = 'Already have an account? <a id="pinToggleLink">Log in</a>';
      } else {
        pinSubtitle.textContent = 'Enter your 6-digit PIN';
        pinToggleEl.innerHTML = 'New here? <a id="pinToggleLink">Create account</a>';
      }
      var link = document.getElementById('pinToggleLink');
      if (link) link.addEventListener('click', function () { switchPinMode(pinMode === 'login' ? 'invite' : 'login'); });
    }
    numPadEl.style.display = showPad ? '' : 'none';
    pinDotsEl.style.display = showDots ? '' : 'none';
    pinToggleEl.style.display = showToggle ? '' : 'none';
  }

  function switchPinMode(mode) {
    pinMode = mode; createFirstPin = ''; createName = ''; enteredPin = ''; pinSubmitting = false;
    updatePinDots(); pinErrorEl.textContent = ''; updatePinUI(); renderNumPad();
  }

  function verifyInviteCode() {
    var code = (pinInviteInput.value || '').trim();
    if (!code) { pinInviteInput.focus(); return; }
    hashPin(code).then(function (hash) {
      if (hash === INVITE_HASH) {
        pinErrorEl.textContent = '';
        pinMode = 'create'; updatePinUI(); renderNumPad();
      } else {
        pinErrorEl.textContent = 'Invalid invite code.';
        pinShake();
      }
    });
  }
  pinInviteBtn.addEventListener('click', verifyInviteCode);
  pinInviteInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') verifyInviteCode(); });

  function updatePinDots() {
    var dots = pinDotsEl.querySelectorAll('.pin-dot');
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('filled', i < enteredPin.length);
  }

  function addPinDigit(d) {
    if (enteredPin.length >= pinMaxLen || pinSubmitting) return;
    enteredPin += d; updatePinDots(); pinErrorEl.textContent = '';
    if (enteredPin.length === pinMaxLen) { pinSubmitting = true; setTimeout(submitPin, 180); }
  }

  function clearPinEntry() { enteredPin = ''; updatePinDots(); pinErrorEl.textContent = ''; pinSubmitting = false; }

  function backspacePin() {
    if (enteredPin.length > 0) { enteredPin = enteredPin.slice(0, -1); updatePinDots(); }
  }

  function hashPin(pin) {
    var enc = new TextEncoder().encode(pin);
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
      var arr = Array.from(new Uint8Array(buf));
      return arr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function generateSalt() {
    var arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function hexToBytes(hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    return bytes;
  }

  function deriveKey(pin, saltHex) {
    var enc = new TextEncoder().encode(pin);
    var salt = hexToBytes(saltHex);
    return crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits']).then(function (key) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256);
    }).then(function (bits) {
      return Array.from(new Uint8Array(bits)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function pinShake() {
    var card = pinOverlay.querySelector('.pin-card');
    card.classList.add('pin-shake');
    setTimeout(function () { card.classList.remove('pin-shake'); }, 450);
  }

  function submitPin() {
    if (pinMode === 'create') {
      if (!createFirstPin) {
        createFirstPin = enteredPin;
        enteredPin = ''; pinSubmitting = false; updatePinDots();
        pinSubtitle.textContent = 'Confirm your PIN';
        renderNumPad();
        return;
      }
      if (enteredPin !== createFirstPin) {
        pinErrorEl.textContent = "PINs don't match. Try again.";
        pinShake(); createFirstPin = ''; enteredPin = ''; pinSubmitting = false; updatePinDots();
        pinSubtitle.textContent = 'Choose a 6-digit PIN';
        renderNumPad();
        return;
      }
      pinMode = 'name'; pinErrorEl.textContent = ''; updatePinUI();
    } else {
      hashPin(enteredPin).then(function (pathKey) {
        pinSubtitle.textContent = 'Checking\u2026';
        WT.getFirebaseDb().ref('tracker/' + pathKey + '/profile').once('value').then(function (snap) {
          var profile = snap.val();
          if (!profile) {
            pinErrorEl.textContent = 'PIN not recognized.';
            pinSubtitle.textContent = 'Enter your 6-digit PIN';
            pinShake(); enteredPin = ''; pinSubmitting = false; updatePinDots(); renderNumPad();
            return;
          }
          var salt = profile.salt;
          function applyProfilePrefs(prof) {
            if (prof.trackedMacros && Array.isArray(prof.trackedMacros)) {
              WT.savePrefs(prof.trackedMacros);
            } else {
              WT.savePrefs(WT.DEFAULT_TRACKED.slice());
            }
          }
          if (salt) {
            deriveKey(enteredPin, salt).then(function (derived) {
              if (derived === profile.pinHash) {
                saveAccount(pathKey, profile.name || '');
                localStorage.setItem(PIN_HASH_KEY, pathKey);
                localStorage.setItem(USERNAME_KEY, profile.name || '');
                applyProfilePrefs(profile);
                WT.unlockApp(pathKey);
              } else {
                pinErrorEl.textContent = 'PIN not recognized.';
                pinSubtitle.textContent = 'Enter your 6-digit PIN';
                pinShake(); enteredPin = ''; pinSubmitting = false; updatePinDots(); renderNumPad();
              }
            });
          } else {
            saveAccount(pathKey, profile.name || '');
            localStorage.setItem(PIN_HASH_KEY, pathKey);
            localStorage.setItem(USERNAME_KEY, profile.name || '');
            applyProfilePrefs(profile);
            WT.unlockApp(pathKey);
          }
        }).catch(function () {
          var acct = findAccount(pathKey);
          if (!acct) {
            pinErrorEl.textContent = 'Offline. PIN not found locally.';
            pinSubtitle.textContent = 'Enter your 6-digit PIN';
            pinShake(); enteredPin = ''; pinSubmitting = false; updatePinDots(); renderNumPad();
            return;
          }
          localStorage.setItem(PIN_HASH_KEY, pathKey);
          localStorage.setItem(USERNAME_KEY, acct.name || '');
          WT.trackedMacros = WT.loadPrefs();
          WT.unlockApp(pathKey);
        });
      });
    }
  }

  function finishCreateAccount() {
    createName = (pinNameInput.value || '').trim();
    if (!createName) { pinNameInput.focus(); return; }
    var salt = generateSalt();
    hashPin(createFirstPin).then(function (pathKey) {
      return deriveKey(createFirstPin, salt).then(function (pinHash) {
        var profileData = { name: createName, salt: salt, pinHash: pinHash, trackedMacros: WT.DEFAULT_TRACKED.slice() };
        WT.savePrefs(WT.DEFAULT_TRACKED.slice());
        return WT.getFirebaseDb().ref('tracker/' + pathKey + '/profile').set(profileData).then(function () {
          saveAccount(pathKey, createName);
          localStorage.setItem(PIN_HASH_KEY, pathKey);
          localStorage.setItem(USERNAME_KEY, createName);
          WT.unlockApp(pathKey);
        }).catch(function () {
          saveAccount(pathKey, createName);
          localStorage.setItem(PIN_HASH_KEY, pathKey);
          localStorage.setItem(USERNAME_KEY, createName);
          WT.unlockApp(pathKey);
        });
      });
    });
  }
  pinNameBtn.addEventListener('click', finishCreateAccount);
  pinNameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') finishCreateAccount(); });

  WT.showPinScreen = function () {
    pinOverlay.classList.remove('hidden');
    appWrap.style.display = 'none';
    pinMode = 'login';
    createFirstPin = ''; enteredPin = ''; pinSubmitting = false;
    updatePinDots(); pinErrorEl.textContent = '';
    updatePinUI(); renderNumPad();
  };

  WT.unlockApp = function (hash) {
    pinOverlay.classList.add('hidden');
    appWrap.style.display = '';
    setGreeting(localStorage.getItem(USERNAME_KEY) || '');
    WT.initApp(hash);
  };

  WT.lockApp = function () {
    localStorage.removeItem(PIN_HASH_KEY);
    if (WT.fbListener) { WT.fbListener(); WT.fbListener = null; }
    WT.appInited = false;
    WT.showPinScreen();
  };
})();
