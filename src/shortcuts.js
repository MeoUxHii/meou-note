import { state, dom } from './state.js';
import { unselectImage } from './image.js';
import { hideDeleteConfirm, createNewNote, switchNote } from './tabs.js';
import { openSearchModal, closeSearchModal, updateSearchSelectedClass, hideDropdown } from './search.js';
import { toggleFocusMode, exitFocusMode, execFormat, updatePlaceholder } from './editor.js';
import { saveCurrentNoteToMemory, persistNotesToStorage, scheduleAutoSave } from './storage.js';
import { copyAll } from './export.js';
import { showToast } from './utils.js';

export function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;

    if (e.key === 'Escape') {
      if (state.selectedImage) {
        unselectImage();
        return;
      }
      if (dom.deleteConfirmPopover && dom.deleteConfirmPopover.classList.contains('show')) {
        hideDeleteConfirm();
        return;
      }
      if (dom.searchModal && dom.searchModal.classList.contains('show')) {
        closeSearchModal();
        return;
      }
      if (dom.shortcutsModal && dom.shortcutsModal.classList.contains('show')) {
        dom.shortcutsModal.classList.remove('show');
        return;
      }
      if (state.isFocusMode) {
        exitFocusMode();
        return;
      }
      hideDropdown();
    }

    if (state.selectedImage && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      state.selectedImage.remove();
      unselectImage();
      updatePlaceholder();
      scheduleAutoSave();
      return;
    }

    if (isCmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (dom.searchModal && dom.searchModal.classList.contains('show')) {
        closeSearchModal();
      } else {
        openSearchModal();
      }
      return;
    }

    if (dom.searchModal && dom.searchModal.classList.contains('show')) {
      const items = dom.searchResultsList.querySelectorAll('.search-result-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
          state.searchSelectedIndex = (state.searchSelectedIndex + 1) % items.length;
          updateSearchSelectedClass(items);
        }
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length > 0) {
          state.searchSelectedIndex = (state.searchSelectedIndex - 1 + items.length) % items.length;
          updateSearchSelectedClass(items);
        }
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = items[state.searchSelectedIndex];
        if (selected) {
          closeSearchModal();
          switchNote(selected.dataset.id);
        }
        return;
      }
    }

    if (e.key === 'F10') {
      e.preventDefault();
      toggleFocusMode();
      return;
    }

    if (isCmdOrCtrl && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      createNewNote();
      return;
    }

    if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      saveCurrentNoteToMemory();
      persistNotesToStorage();
      showToast('Saved to device');
      return;
    }

    if (isCmdOrCtrl && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      copyAll();
      return;
    }

    if (isCmdOrCtrl && e.key === '/') {
      e.preventDefault();
      if (dom.shortcutsModal) dom.shortcutsModal.classList.toggle('show');
      return;
    }

    if (isCmdOrCtrl && e.shiftKey && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault();
      execFormat('strikeThrough');
      return;
    }

    if (e.key === 'Tab' && document.activeElement === dom.editor) {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand('outdent');
      } else {
        document.execCommand('insertText', false, '    ');
      }
      scheduleAutoSave();
    }
  });
}
