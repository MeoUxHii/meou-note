import { STORAGE_NOTES, STORAGE_ACTIVE_ID, STORAGE_SETTINGS, DEFAULT_NOTE, state, dom } from './state.js';
import { showToast } from './utils.js';
import { updatePlaceholder, updateStats } from './editor.js';

export function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_SETTINGS);
    if (saved) {
      state.settings = { ...state.settings, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Error loading settings:', err);
  }

  if (!state.settings.theme) {
    state.settings.theme = 'dark';
  }
  if (state.settings.autoDetectLists === undefined) {
    state.settings.autoDetectLists = false;
  }
}

export function saveSettings() {
  try {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(state.settings));
  } catch (err) {
    console.warn('Error saving settings:', err);
  }
}

export function applySettings() {
  document.documentElement.setAttribute('data-theme', state.settings.theme);
  document.documentElement.style.setProperty('--font-editor', state.settings.font);
  document.documentElement.style.setProperty('--font-size', `${state.settings.fontSize}px`);

  if (dom.fontSelect) dom.fontSelect.value = state.settings.font;
  if (dom.fontSizeText) dom.fontSizeText.textContent = state.settings.fontSize;

  if (dom.autoListsStatus) {
    const isAuto = !!state.settings.autoDetectLists;
    dom.autoListsStatus.textContent = isAuto ? 'On' : 'Off';
    dom.autoListsStatus.classList.toggle('active', isAuto);
  }
}

export function toggleAutoDetectLists() {
  state.settings.autoDetectLists = !state.settings.autoDetectLists;
  applySettings();
  saveSettings();
  showToast(state.settings.autoDetectLists ? 'Auto-detect lists enabled' : 'Auto-detect lists disabled');
}

export function toggleTheme() {
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  applySettings();
  saveSettings();
  showToast(state.settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode');
}

export function loadNotes() {
  try {
    let saved = localStorage.getItem(STORAGE_NOTES);
    if (!saved) {
      const oldV2 = localStorage.getItem('meou_notes_clean_v2');
      if (oldV2) saved = oldV2;
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.notes = parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading notes from localStorage:', err);
  }

  if (!Array.isArray(state.notes) || state.notes.length === 0) {
    state.notes = [DEFAULT_NOTE];
  }

  const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_ID);
  if (savedActiveId && state.notes.some(n => n.id === savedActiveId)) {
    state.activeNoteId = savedActiveId;
  } else {
    state.activeNoteId = state.notes[0].id;
  }
}

export function getActiveNote() {
  return state.notes.find(n => n.id === state.activeNoteId) || state.notes[0];
}

export function persistNotesToStorage() {
  try {
    localStorage.setItem(STORAGE_NOTES, JSON.stringify(state.notes));
    localStorage.setItem(STORAGE_ACTIVE_ID, state.activeNoteId);
  } catch (err) {
    console.error('Storage write error:', err);
    showToast('Browser storage is full!');
  }
}

export function saveCurrentNoteToMemory() {
  const note = getActiveNote();
  if (!note || !dom.editor || !dom.noteTitleInput) return;

  note.content = dom.editor.innerHTML;
  note.title = dom.noteTitleInput.value.trim() || 'Untitled Note';
  note.updatedAt = Date.now();
}

export function scheduleAutoSave() {
  setSyncStatus('saving');
  if (state.saveTimer) clearTimeout(state.saveTimer);

  state.saveTimer = setTimeout(() => {
    saveCurrentNoteToMemory();
    persistNotesToStorage();
    updateDateHint(getActiveNote());
    setSyncStatus('saved');
  }, 300);
}

export function setSyncStatus(status) {
  if (!dom.syncStatus) return;
  const textEl = dom.syncStatus.querySelector('.sync-text');
  if (status === 'saving') {
    dom.syncStatus.classList.add('saving');
    if (textEl) textEl.textContent = 'Saving...';
  } else {
    dom.syncStatus.classList.remove('saving');
    if (textEl) textEl.textContent = 'Saved';
  }
}

export function loadActiveNote() {
  const note = getActiveNote();
  if (!note) return;

  dom.noteTitleInput.value = note.title || '';
  dom.editor.innerHTML = note.content || '';
  updateDateHint(note);
  updatePlaceholder();
  updateStats();
}

export function updateDateHint(note) {
  if (!dom.noteDateHint || !note) return;
  const d = new Date(note.updatedAt || Date.now());
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  dom.noteDateHint.textContent = `Updated at ${hours}:${mins} • ${dateStr}`;
}
