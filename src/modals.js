export function initModals() {
  const container = document.getElementById('appLayout') || document.body;

  if (!document.getElementById('exitFocusBtn')) {
    const exitFocusBtn = document.createElement('button');
    exitFocusBtn.className = 'btn-exit-focus';
    exitFocusBtn.id = 'exitFocusBtn';
    exitFocusBtn.title = 'Exit Focus Mode (F10 / Esc)';
    exitFocusBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>
      <span>Exit Zen Mode</span>
    `;
    container.appendChild(exitFocusBtn);
  }

  if (!document.getElementById('deleteConfirmPopover')) {
    const deletePopover = document.createElement('div');
    deletePopover.className = 'delete-confirm-popover';
    deletePopover.id = 'deleteConfirmPopover';
    deletePopover.setAttribute('aria-hidden', 'true');
    deletePopover.innerHTML = `
      <p class="popover-msg">Delete this note?</p>
      <div class="popover-actions">
        <button class="btn-popover-cancel" id="cancelDeleteBtn">Cancel</button>
        <button class="btn-popover-delete" id="confirmDeleteBtn">Delete</button>
      </div>
    `;
    container.appendChild(deletePopover);
  }

  if (!document.getElementById('searchModal')) {
    const searchModal = document.createElement('div');
    searchModal.className = 'modal-overlay';
    searchModal.id = 'searchModal';
    searchModal.setAttribute('aria-hidden', 'true');
    searchModal.innerHTML = `
      <div class="search-modal-box">
        <div class="search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="searchInput" class="search-input" placeholder="Search notes by title or content..." autocomplete="off">
          <span class="modal-esc-hint">ESC to close</span>
        </div>
        <div class="search-results-list" id="searchResultsList"></div>
      </div>
    `;
    container.appendChild(searchModal);
  }

  if (!document.getElementById('shortcutsModal')) {
    const shortcutsModal = document.createElement('div');
    shortcutsModal.className = 'modal-overlay';
    shortcutsModal.id = 'shortcutsModal';
    shortcutsModal.setAttribute('aria-hidden', 'true');
    shortcutsModal.innerHTML = `
      <div class="shortcuts-modal-box">
        <div class="modal-header">
          <h3>Keyboard Shortcuts</h3>
          <button class="btn-modal-close" id="closeShortcutsBtn">✕</button>
        </div>
        <div class="shortcuts-grid">
          <div class="shortcut-row"><span>Bold</span><kbd>Ctrl + B</kbd></div>
          <div class="shortcut-row"><span>Italic</span><kbd>Ctrl + I</kbd></div>
          <div class="shortcut-row"><span>Underline</span><kbd>Ctrl + U</kbd></div>
          <div class="shortcut-row"><span>Strikethrough</span><kbd>Ctrl + Shift + X</kbd></div>
          <div class="shortcut-row"><span>Inline Code</span><kbd>Ctrl + E</kbd></div>
          <div class="shortcut-row"><span>Search Notes</span><kbd>Ctrl + K</kbd></div>
          <div class="shortcut-row"><span>New Note</span><kbd>Ctrl + N</kbd></div>
          <div class="shortcut-row"><span>Zen Focus Mode</span><kbd>F10</kbd></div>
          <div class="shortcut-row"><span>Indent Line</span><kbd>Tab</kbd></div>
          <div class="shortcut-row"><span>Outdent Line</span><kbd>Shift + Tab</kbd></div>
          <div class="shortcut-row"><span>Heading 1 / 2</span><kbd>Type # or ## + Space</kbd></div>
          <div class="shortcut-row"><span>Bullet List</span><kbd>Toolbar or Auto-detect</kbd></div>
          <div class="shortcut-row"><span>Blockquote</span><kbd>Type > + Space</kbd></div>
        </div>
      </div>
    `;
    container.appendChild(shortcutsModal);
  }

  if (!document.getElementById('toast')) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    container.appendChild(toast);
  }
}
