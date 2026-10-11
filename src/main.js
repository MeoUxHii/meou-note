import { initDom } from './state.js';
import { loadSettings, loadNotes, applySettings, loadActiveNote } from './storage.js';
import { renderTabs } from './tabs.js';
import { updateStats, updatePlaceholder } from './editor.js';
import { initImageResizerEvents } from './image.js';
import { bindEvents } from './events.js';
import { initKeyboardShortcuts } from './shortcuts.js';
import { initModals } from './modals.js';

export function init() {
  initModals();
  initDom();
  loadSettings();
  loadNotes();
  applySettings();
  renderTabs();
  loadActiveNote();
  bindEvents();
  initKeyboardShortcuts();
  initImageResizerEvents();
  updateStats();
  updatePlaceholder();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
