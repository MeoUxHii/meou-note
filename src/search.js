import { state, dom } from './state.js';
import { stripHtml, escapeHtml } from './utils.js';
import { switchNote } from './tabs.js';
import { saveCurrentNoteToMemory } from './storage.js';

export function hideDropdown() {
  if (dom.moreDropdown) dom.moreDropdown.classList.remove('show');
}

export function openSearchModal() {
  saveCurrentNoteToMemory();
  hideDropdown();
  dom.searchModal.classList.add('show');
  dom.searchModal.setAttribute('aria-hidden', 'false');
  dom.searchInput.value = '';
  state.searchSelectedIndex = 0;
  renderSearchResults('');
  dom.searchInput.focus();
}

export function closeSearchModal() {
  dom.searchModal.classList.remove('show');
  dom.searchModal.setAttribute('aria-hidden', 'true');
  dom.editor.focus();
}

export function renderSearchResults(query) {
  const q = query.trim().toLowerCase();
  dom.searchResultsList.innerHTML = '';

  const matches = state.notes.filter(note => {
    if (!q) return true;
    const titleMatch = (note.title || '').toLowerCase().includes(q);
    const text = stripHtml(note.content || '').toLowerCase();
    const contentMatch = text.includes(q);
    return titleMatch || contentMatch;
  });

  if (matches.length === 0) {
    dom.searchResultsList.innerHTML = `<div class="search-empty">No matching notes found</div>`;
    return;
  }

  matches.forEach((note, idx) => {
    const item = document.createElement('div');
    item.className = `search-result-item ${idx === state.searchSelectedIndex ? 'selected' : ''}`;
    item.dataset.id = note.id;

    const plainText = stripHtml(note.content || '').replace(/\s+/g, ' ').trim();
    const snippet = plainText ? plainText.slice(0, 80) + '...' : '(Empty note)';

    item.innerHTML = `
      <div class="search-result-title">${escapeHtml(note.title || 'Untitled Note')}</div>
      <div class="search-result-snippet">${escapeHtml(snippet)}</div>
    `;

    item.addEventListener('click', () => {
      closeSearchModal();
      switchNote(note.id);
    });

    dom.searchResultsList.appendChild(item);
  });
}

export function updateSearchSelectedClass(items) {
  items.forEach((item, idx) => {
    item.classList.toggle('selected', idx === state.searchSelectedIndex);
    if (idx === state.searchSelectedIndex) {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}
