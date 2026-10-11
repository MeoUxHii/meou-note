import { state, dom } from './state.js';
import { loadSettings, saveSettings, applySettings, toggleAutoDetectLists, toggleTheme, getActiveNote, scheduleAutoSave } from './storage.js';
import { updateTabTitle, hideDeleteConfirm, deleteNote, createNewNote } from './tabs.js';
import { updateStats, updatePlaceholder, execFormat, updateToolbarStates, handleMarkdownShortcuts, toggleFocusMode, exitFocusMode } from './editor.js';
import { insertResizableImage, compressImageFile } from './image.js';
import { openSearchModal, closeSearchModal, renderSearchResults, hideDropdown } from './search.js';
import { copyAll, exportTxt, exportMd, backupAllJson, handleImportJson, clearCurrentNote } from './export.js';
import { escapeHtml } from './utils.js';

function toggleDropdown() {
  if (dom.moreDropdown) dom.moreDropdown.classList.toggle('show');
}

export function bindEvents() {
  dom.editor.addEventListener('input', () => {
    updatePlaceholder();
    updateStats();
    scheduleAutoSave();
  });

  dom.editor.addEventListener('keydown', (e) => {
    handleMarkdownShortcuts(e);
  });

  dom.noteTitleInput.addEventListener('input', (e) => {
    const newTitle = e.target.value.trim() || 'Untitled Note';
    const active = getActiveNote();
    if (active) {
      active.title = newTitle;
      updateTabTitle(active.id, newTitle);
      scheduleAutoSave();
    }
  });

  dom.noteTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dom.editor.focus();
    }
  });

  dom.canvasWrap.addEventListener('click', (e) => {
    if (e.target === dom.canvasWrap || e.target === dom.canvasInner) {
      dom.editor.focus();
    }
  });

  document.addEventListener('selectionchange', () => {
    updateToolbarStates();
  });

  const preventBlurButtons = [
    dom.btnBold, dom.btnItalic, dom.btnUnderline, dom.btnStrike, dom.btnCode, dom.btnBullet, dom.btnNumber
  ];

  preventBlurButtons.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
  });

  dom.btnBold.addEventListener('click', () => execFormat('bold'));
  dom.btnItalic.addEventListener('click', () => execFormat('italic'));
  dom.btnUnderline.addEventListener('click', () => execFormat('underline'));
  dom.btnStrike.addEventListener('click', () => execFormat('strikeThrough'));
  dom.btnCode.addEventListener('click', () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      document.execCommand('insertHTML', false, `<code>${escapeHtml(selection.toString())}</code>`);
    } else {
      execFormat('formatBlock', '<pre>');
    }
    scheduleAutoSave();
  });
  dom.btnBullet.addEventListener('click', () => execFormat('insertUnorderedList'));
  dom.btnNumber.addEventListener('click', () => execFormat('insertOrderedList'));

  dom.addNoteBtn.addEventListener('click', createNewNote);

  dom.fontSelect.addEventListener('change', (e) => {
    state.settings.font = e.target.value;
    applySettings();
    saveSettings();
  });

  dom.decreaseFontBtn.addEventListener('click', () => {
    if (state.settings.fontSize > 11) {
      state.settings.fontSize -= 1;
      applySettings();
      saveSettings();
    }
  });

  dom.increaseFontBtn.addEventListener('click', () => {
    if (state.settings.fontSize < 32) {
      state.settings.fontSize += 1;
      applySettings();
      saveSettings();
    }
  });

  dom.themeToggleBtn.addEventListener('click', toggleTheme);
  dom.focusModeBtn.addEventListener('click', toggleFocusMode);
  dom.exitFocusBtn.addEventListener('click', exitFocusMode);

  dom.moreMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  if (dom.cancelDeleteBtn) {
    dom.cancelDeleteBtn.addEventListener('click', hideDeleteConfirm);
  }
  if (dom.confirmDeleteBtn) {
    dom.confirmDeleteBtn.addEventListener('click', () => {
      if (state.pendingDeleteNoteId) {
        deleteNote(state.pendingDeleteNoteId);
        hideDeleteConfirm();
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (dom.moreDropdown && !dom.moreDropdown.contains(e.target) && e.target !== dom.moreMenuBtn) {
      hideDropdown();
    }
    if (dom.deleteConfirmPopover && !dom.deleteConfirmPopover.contains(e.target) && !e.target.closest('.tab-close')) {
      hideDeleteConfirm();
    }
  });

  dom.copyAllItem.addEventListener('click', () => { hideDropdown(); copyAll(); });
  dom.exportTxtItem.addEventListener('click', () => { hideDropdown(); exportTxt(); });
  dom.exportMdItem.addEventListener('click', () => { hideDropdown(); exportMd(); });
  dom.backupJsonItem.addEventListener('click', () => { hideDropdown(); backupAllJson(); });
  dom.importJsonInput.addEventListener('change', handleImportJson);
  if (dom.toggleAutoListsItem) {
    dom.toggleAutoListsItem.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAutoDetectLists();
    });
  }
  dom.shortcutsModalItem.addEventListener('click', () => {
    hideDropdown();
    dom.shortcutsModal.classList.add('show');
  });
  dom.clearNoteItem.addEventListener('click', () => { hideDropdown(); clearCurrentNote(); });

  dom.searchBtn.addEventListener('click', openSearchModal);
  dom.searchInput.addEventListener('input', (e) => {
    state.searchSelectedIndex = 0;
    renderSearchResults(e.target.value);
  });

  dom.searchModal.addEventListener('click', (e) => {
    if (e.target === dom.searchModal) closeSearchModal();
  });

  dom.shortcutsBtn.addEventListener('click', () => dom.shortcutsModal.classList.add('show'));
  dom.closeShortcutsBtn.addEventListener('click', () => dom.shortcutsModal.classList.remove('show'));
  dom.shortcutsModal.addEventListener('click', (e) => {
    if (e.target === dom.shortcutsModal) dom.shortcutsModal.classList.remove('show');
  });

  dom.editor.addEventListener('paste', async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    let hasImage = false;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          hasImage = true;
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const dataUrl = await compressImageFile(file);
            if (dataUrl) insertResizableImage(dataUrl);
          }
          break;
        }
      }
    }

    if (!hasImage) {
      e.preventDefault();
      const text = clipboardData.getData('text/plain');
      if (text) {
        document.execCommand('insertText', false, text);
      }
      updatePlaceholder();
      updateStats();
      scheduleAutoSave();
    }
  });

  dom.editor.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  dom.editor.addEventListener('drop', async (e) => {
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          e.preventDefault();
          const dataUrl = await compressImageFile(files[i]);
          if (dataUrl) insertResizableImage(dataUrl);
          break;
        }
      }
    }
  });

  dom.tabsList.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      dom.tabsList.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}
