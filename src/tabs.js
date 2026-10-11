import { state, dom, generateNoteId } from './state.js';
import { showToast } from './utils.js';
import { saveCurrentNoteToMemory, persistNotesToStorage, loadActiveNote } from './storage.js';
import { unselectImage } from './image.js';

export function isNoteEmpty(note) {
  if (!note) return true;

  if (note.id === state.activeNoteId) {
    if (dom.editor) {
      if (dom.editor.querySelector('img')) return false;
      const text = (dom.editor.innerText || dom.editor.textContent || '')
        .replace(/[\s\u200B\u00A0]/g, '');
      if (text.length > 0) return false;
    }

    const currentTitle = dom.noteTitleInput ? dom.noteTitleInput.value.trim() : '';
    const isDefaultTitle = !currentTitle ||
      /^(?:Note(?:\s*\d+)?|Untitled Note|Ghi chú(?:\s*\d+)?)$/i.test(currentTitle);
    if (!isDefaultTitle) return false;

    return true;
  }

  const title = (note.title || '').trim();
  const isDefaultTitle = !title ||
    /^(?:Note(?:\s*\d+)?|Untitled Note|Ghi chú(?:\s*\d+)?)$/i.test(title);
  if (!isDefaultTitle) return false;

  const content = note.content || '';
  if (!content.trim()) return true;
  if (/<img\b[^>]*>/i.test(content)) return false;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const text = (tempDiv.innerText || tempDiv.textContent || '')
    .replace(/[\s\u200B\u00A0]/g, '');
  return text.length === 0;
}

export function renderTabs() {
  dom.tabsList.innerHTML = '';

  state.notes.forEach((note) => {
    const tab = document.createElement('div');
    const isActive = note.id === state.activeNoteId;
    tab.className = `tab-btn ${isActive ? 'active' : ''}`;
    tab.dataset.id = note.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');

    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title';
    titleSpan.textContent = note.title || 'Untitled Note';
    titleSpan.title = note.title || 'Untitled Note';
    tab.appendChild(titleSpan);

    if (state.notes.length > 1) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close';
      closeBtn.innerHTML = '✕';
      closeBtn.title = 'Delete note';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isNoteEmpty(note)) {
          hideDeleteConfirm();
          deleteNote(note.id);
        } else {
          showDeleteConfirm(note.id, tab);
        }
      });
      tab.appendChild(closeBtn);
    }

    tab.addEventListener('click', () => {
      if (state.activeNoteId !== note.id) {
        hideDeleteConfirm();
        switchNote(note.id);
      }
    });

    tab.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      dom.noteTitleInput.focus();
      dom.noteTitleInput.select();
    });

    dom.tabsList.appendChild(tab);
  });

  const activeTabEl = dom.tabsList.querySelector('.tab-btn.active');
  if (activeTabEl) {
    activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
}

export function showDeleteConfirm(noteId, triggerElement) {
  state.pendingDeleteNoteId = noteId;
  const popover = dom.deleteConfirmPopover;
  if (!popover) return;

  popover.classList.add('show');
  popover.setAttribute('aria-hidden', 'false');

  const rect = triggerElement.getBoundingClientRect();
  const popoverWidth = 196;
  let left = rect.left + rect.width / 2 - popoverWidth / 2;
  left = Math.max(10, Math.min(window.innerWidth - popoverWidth - 10, left));
  const top = rect.bottom + 6;

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
}

export function hideDeleteConfirm() {
  if (dom.deleteConfirmPopover) {
    dom.deleteConfirmPopover.classList.remove('show');
    dom.deleteConfirmPopover.setAttribute('aria-hidden', 'true');
  }
  state.pendingDeleteNoteId = null;
}

export function updateTabTitle(noteId, newTitle) {
  const tabEl = dom.tabsList.querySelector(`.tab-btn[data-id="${noteId}"] .tab-title`);
  if (tabEl) {
    tabEl.textContent = newTitle || 'Untitled Note';
    tabEl.title = newTitle || 'Untitled Note';
  }
}

export function switchNote(targetId) {
  unselectImage();
  saveCurrentNoteToMemory();
  state.activeNoteId = targetId;
  persistNotesToStorage();

  renderTabs();
  loadActiveNote();
  dom.editor.focus();
}

export function createNewNote() {
  unselectImage();
  saveCurrentNoteToMemory();

  const newId = generateNoteId();
  const newNote = {
    id: newId,
    title: `Note ${state.notes.length + 1}`,
    content: '',
    updatedAt: Date.now()
  };

  state.notes.push(newNote);
  state.activeNoteId = newId;
  persistNotesToStorage();

  renderTabs();
  loadActiveNote();
  dom.editor.focus();
  showToast('New note created');
}

export function deleteNote(noteId) {
  if (state.notes.length <= 1) {
    showToast('Cannot delete the only remaining note');
    return;
  }

  unselectImage();
  hideDeleteConfirm();

  // Save current active note first so no pending text in active note is lost
  saveCurrentNoteToMemory();

  if (state.saveTimer) {
    clearTimeout(state.saveTimer);
    state.saveTimer = null;
  }

  const wasActive = state.activeNoteId === noteId;

  state.notes = state.notes.filter(n => n.id !== noteId);

  if (wasActive) {
    state.activeNoteId = state.notes[0].id;
  }

  persistNotesToStorage();
  renderTabs();
  if (wasActive) {
    loadActiveNote();
  }
  showToast('Note deleted');
}
