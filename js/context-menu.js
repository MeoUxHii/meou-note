(function () {
  'use strict';

  let savedRange = null;

  function hideChromeContextMenu() {
    const menu = document.getElementById('chromeContextMenu');
    if (menu) menu.classList.add('hidden');
  }

  function ensureContextMenuDom() {
    let menu = document.getElementById('chromeContextMenu');
    if (!menu && document.body) {
      menu = document.createElement('div');
      menu.id = 'chromeContextMenu';
      menu.className = 'chrome-ctx-menu hidden';
      menu.setAttribute('role', 'menu');
      menu.innerHTML = `
        <div class="ctx-item" data-action="emoji">
          <span class="ctx-text">Emoji Picker</span>
          <span class="ctx-shortcut">Win + .</span>
        </div>
        <div class="ctx-divider"></div>
        <div class="ctx-item" data-action="cut">
          <span class="ctx-text">Cut</span>
          <span class="ctx-shortcut">Ctrl+X</span>
        </div>
        <div class="ctx-item" data-action="copy">
          <span class="ctx-text">Copy</span>
          <span class="ctx-shortcut">Ctrl+C</span>
        </div>
        <div class="ctx-item" data-action="paste">
          <span class="ctx-text">Paste</span>
          <span class="ctx-shortcut">Ctrl+V</span>
        </div>
        <div class="ctx-item" data-action="paste-plain">
          <span class="ctx-text">Paste Plain Text</span>
          <span class="ctx-shortcut">Ctrl+Shift+V</span>
        </div>
        <div class="ctx-item" data-action="select-all">
          <span class="ctx-text">Select All</span>
          <span class="ctx-shortcut">Ctrl+A</span>
        </div>
        <div class="ctx-item" data-action="read-mode">
          <span class="ctx-text">Zen Focus Mode</span>
          <span class="ctx-shortcut">F10</span>
        </div>
        <div class="ctx-divider"></div>
        <div class="ctx-item" data-action="search" id="ctxSearchItem">
          <span id="ctxSearchText" class="ctx-text">Search Google</span>
        </div>
        <div class="ctx-item" data-action="print">
          <span class="ctx-text">Print...</span>
          <span class="ctx-shortcut">Ctrl+P</span>
        </div>
        <div class="ctx-item" data-action="translate" id="ctxTranslateItem">
          <span class="ctx-text">Translate selection</span>
        </div>
      `;
      document.body.appendChild(menu);
    }
    return menu;
  }

  function showChromeContextMenu(e) {
    const menu = ensureContextMenuDom();
    if (!menu) return;

    const sel = window.getSelection();
    savedRange = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;

    const selectionText = (sel ? sel.toString() : '').trim();
    const hasSelection = selectionText.length > 0;
    const displaySelection = hasSelection
      ? (selectionText.length > 15 ? selectionText.slice(0, 15) + '…' : selectionText)
      : '';

    const cutItem = menu.querySelector('[data-action="cut"]');
    const copyItem = menu.querySelector('[data-action="copy"]');
    const translateItem = menu.querySelector('[data-action="translate"]');
    const searchText = document.getElementById('ctxSearchText');

    if (cutItem) cutItem.classList.toggle('disabled', !hasSelection);
    if (copyItem) copyItem.classList.toggle('disabled', !hasSelection);
    if (translateItem) translateItem.classList.toggle('disabled', !hasSelection);
    if (searchText) {
      searchText.textContent = hasSelection ? `Search Google for “${displaySelection}”` : 'Search Google';
    }

    menu.classList.remove('hidden');

    const menuWidth = 280;
    const menuHeight = menu.offsetHeight || 360;
    let left = e.clientX;
    let top = e.clientY;

    if (left + menuWidth > window.innerWidth) {
      left = Math.max(8, window.innerWidth - menuWidth - 8);
    }
    if (top + menuHeight > window.innerHeight) {
      top = Math.max(8, window.innerHeight - menuHeight - 8);
    }

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showChromeContextMenu(e);
    return false;
  }, { capture: true });

  document.addEventListener('click', function (e) {
    const menu = document.getElementById('chromeContextMenu');
    if (menu && !menu.contains(e.target)) {
      hideChromeContextMenu();
    }
  });

  window.addEventListener('blur', hideChromeContextMenu);
  window.addEventListener('scroll', hideChromeContextMenu, true);

  function initContextMenuActions() {
    const menu = ensureContextMenuDom();
    if (!menu) return;

    menu.addEventListener('click', function (e) {
      const item = e.target.closest('.ctx-item');
      if (!item || item.classList.contains('disabled')) return;
      e.stopPropagation();

      const action = item.dataset.action;
      const editor = document.getElementById('editor');
      const selectedText = window.getSelection() ? window.getSelection().toString() : '';

      hideChromeContextMenu();

      if (action === 'emoji') {
        if (editor) editor.focus();
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = 'Emoji shortcut: Windows + . (or Cmd + Ctrl + Space)';
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2500);
        }
      } else if (action === 'cut') {
        if (editor) {
          editor.focus();
          if (savedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
          }
        }
        if (selectedText) {
          navigator.clipboard.writeText(selectedText);
          document.execCommand('delete');
          if (editor) {
            editor.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      } else if (action === 'copy') {
        if (selectedText) {
          navigator.clipboard.writeText(selectedText);
        }
      } else if (action === 'paste' || action === 'paste-plain') {
        if (editor) {
          editor.focus();
          if (savedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
          }
        }
        navigator.clipboard.readText().then(text => {
          if (text) {
            document.execCommand('insertText', false, text);
            if (editor) {
              editor.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        }).catch(() => {
          try { document.execCommand('paste'); } catch (_) {}
        });
      } else if (action === 'select-all') {
        if (editor) {
          editor.focus();
          document.execCommand('selectAll');
        } else {
          window.getSelection().selectAllChildren(document.body);
        }
      } else if (action === 'read-mode') {
        const focusBtn = document.getElementById('focusModeBtn');
        if (focusBtn) focusBtn.click();
      } else if (action === 'search') {
        const q = selectedText.trim();
        if (q) {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
        } else {
          window.open('https://www.google.com', '_blank');
        }
      } else if (action === 'print') {
        window.print();
      } else if (action === 'translate') {
        const q = selectedText.trim();
        if (q) {
          window.open(`https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(q)}&op=translate`, '_blank');
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContextMenuActions);
  } else {
    initContextMenuActions();
  }

  window.hideChromeContextMenu = hideChromeContextMenu;
})();
