(function () {
  'use strict';

  const urlParams = new URLSearchParams(window.location.search);
  const isDev = urlParams.has('debug') || localStorage.getItem('meou_dev') === '1';

  let appLoaded = false;
  let devtoolsDetected = false;
  let consecutiveTriggers = 0;

  function loadAppScript() {
    if (appLoaded) return;
    appLoaded = true;
    const script = document.createElement('script');
    if (isDev) {
      script.type = 'module';
      script.src = 'src/main.js';
    } else {
      script.src = 'app.js';
    }
    document.body.appendChild(script);
  }

  if (isDev) {
    console.warn('Developer mode active: Anti-DevTools is disabled.');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadAppScript);
    } else {
      loadAppScript();
    }
    return;
  }

  document.addEventListener('keydown', function (e) {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;

    if (e.key === 'Escape' && typeof window.hideChromeContextMenu === 'function') {
      window.hideChromeContextMenu();
    }

    if (e.altKey && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
      e.preventDefault();
      const focusBtn = document.getElementById('focusModeBtn');
      if (focusBtn) focusBtn.click();
      return false;
    }

    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (isCmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (isCmdOrCtrl && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
    }

    if (isCmdOrCtrl && !e.shiftKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      const btnUnderline = document.getElementById('btnUnderline');
      if (btnUnderline) {
        btnUnderline.click();
      } else {
        try { document.execCommand('underline'); } catch (_) {}
      }
      return false;
    }

    if (isCmdOrCtrl && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
    }
  }, { capture: true });

  const debuggerProbe = new Function('debugger');

  function isDevToolsOpen() {
    const t0 = performance.now();
    try {
      debuggerProbe();
    } catch (_) {}
    const t1 = performance.now();
    return (t1 - t0 > 160);
  }

  function ensureBlockerDom() {
    let blocker = document.getElementById('devtoolsBlocker');
    if (!blocker && document.body) {
      blocker = document.createElement('div');
      blocker.id = 'devtoolsBlocker';
      blocker.className = 'devtools-blocker';
      blocker.setAttribute('role', 'alert');
      blocker.setAttribute('aria-live', 'assertive');
      blocker.innerHTML = `
        <div class="devtools-blocker-card">
          <div class="devtools-blocker-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 class="devtools-blocker-title">Developer Tools Detected</h2>
          <p class="devtools-blocker-desc">
            To protect your private note data, inspect and DevTools shortcuts are restricted. Please close Developer Tools to continue.
          </p>
          <div class="devtools-blocker-actions">
            <button type="button" class="btn-devtools-reload" onclick="window.location.reload()">
              DevTools Closed — Reload Page
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(blocker);
    }
    return blocker;
  }

  function triggerProtection(isDetected) {
    if (isDetected) {
      const blocker = ensureBlockerDom();
      if (blocker) blocker.classList.remove('hidden');
      const layout = document.getElementById('appLayout');
      if (layout) layout.style.filter = 'blur(16px) grayscale(1)';
      document.title = '⚠️ Access Denied — DevTools Blocked';
      try { console.clear(); } catch (_) {}
    } else {
      const blocker = document.getElementById('devtoolsBlocker');
      if (blocker) blocker.classList.add('hidden');
      const layout = document.getElementById('appLayout');
      if (layout) layout.style.filter = '';
      document.title = 'MeoU Note — Online Notepad';

      if (!appLoaded) {
        loadAppScript();
      }
    }
  }

  function monitorDevTools() {
    const isLagging = isDevToolsOpen();

    if (isLagging) {
      consecutiveTriggers++;
      if (consecutiveTriggers >= 2 && !devtoolsDetected) {
        devtoolsDetected = true;
        triggerProtection(true);
      }
    } else {
      consecutiveTriggers = 0;
      if (devtoolsDetected) {
        devtoolsDetected = false;
        triggerProtection(false);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAppScript);
  } else {
    loadAppScript();
  }

  setInterval(monitorDevTools, 800);
})();
