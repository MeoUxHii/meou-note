/**
 * MeoU Note - Truly Minimalist Online Notepad
 * Focus on clean typing, dark mode, robust font selection, and Docs-style formatting (Ctrl+B, Ctrl+I, Ctrl+U).
 */

(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_NOTES = 'meou_notes_clean_v2';
  const STORAGE_ACTIVE_ID = 'meou_active_note_clean_v2';
  const STORAGE_SETTINGS = 'meou_settings_clean_v2';

  // Initial starter note
  const DEFAULT_NOTE = {
    id: 'note_' + Date.now(),
    title: 'Ghi chú 1',
    content: `<b>MeoU Note</b> 🐱

Ghi chú linh tinh nhanh chóng, tự động lưu trên trình duyệt.

• <b>Ctrl + B</b>: In đậm chữ
• <i>Ctrl + I</i>: In nghiêng chữ
• <u>Ctrl + U</u>: Gạch chân chữ

Hãy bắt đầu viết nội dung của bạn tại đây...`,
    updatedAt: Date.now()
  };

  // --- App State ---
  let state = {
    notes: [],
    activeNoteId: null,
    saveTimer: null,
    settings: {
      font: "'JetBrains Mono', monospace",
      fontSize: 15
    }
  };

  // --- DOM Elements ---
  const dom = {
    tabsList: document.getElementById('tabsList'),
    addNoteBtn: document.getElementById('addNoteBtn'),
    editor: document.getElementById('editor'),
    btnBold: document.getElementById('btnBold'),
    btnItalic: document.getElementById('btnItalic'),
    btnUnderline: document.getElementById('btnUnderline'),
    fontSelect: document.getElementById('fontSelect'),
    decreaseFontBtn: document.getElementById('decreaseFontBtn'),
    increaseFontBtn: document.getElementById('increaseFontBtn'),
    fontSizeText: document.getElementById('fontSizeText'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    toast: document.getElementById('toast')
  };

  // --- Init ---
  function init() {
    loadSettings();
    loadNotes();
    bindEvents();
    renderTabs();
    loadActiveNote();
    applySettings();
  }

  // --- Settings ---
  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS);
      if (saved) {
        state.settings = { ...state.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Cannot load settings', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(state.settings));
    } catch (e) {
      console.warn('Cannot save settings', e);
    }
  }

  function applySettings() {
    document.documentElement.style.setProperty('--font-editor', state.settings.font);
    document.documentElement.style.setProperty('--font-size', `${state.settings.fontSize}px`);

    if (dom.fontSelect) dom.fontSelect.value = state.settings.font;
    if (dom.fontSizeText) dom.fontSizeText.textContent = state.settings.fontSize;
  }

  // --- Notes & Storage ---
  function loadNotes() {
    try {
      const saved = localStorage.getItem(STORAGE_NOTES);
      if (saved) {
        state.notes = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Cannot load notes', e);
    }

    if (!Array.isArray(state.notes) || state.notes.length === 0) {
      state.notes = [DEFAULT_NOTE];
    }

    const savedId = localStorage.getItem(STORAGE_ACTIVE_ID);
    if (savedId && state.notes.some(n => n.id === savedId)) {
      state.activeNoteId = savedId;
    } else {
      state.activeNoteId = state.notes[0].id;
    }
  }

  function getActiveNote() {
    return state.notes.find(n => n.id === state.activeNoteId) || state.notes[0];
  }

  function scheduleAutoSave() {
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
      saveActiveNote();
    }, 350);
  }

  function saveActiveNote() {
    const note = getActiveNote();
    if (!note) return;

    note.content = dom.editor.innerHTML;
    note.updatedAt = Date.now();

    // Auto-derive tab title from the first line of content if suitable
    const firstLine = dom.editor.innerText.trim().split('\n')[0] || '';
    if (firstLine.length > 0) {
      const cleanTitle = firstLine.substring(0, 24).trim();
      note.title = cleanTitle || 'Ghi chú';
      updateTabLabel(note.id, note.title);
    }

    try {
      localStorage.setItem(STORAGE_NOTES, JSON.stringify(state.notes));
      localStorage.setItem(STORAGE_ACTIVE_ID, state.activeNoteId);
    } catch (e) {
      console.error('Save failed', e);
    }
  }

  function loadActiveNote() {
    const note = getActiveNote();
    if (!note) return;
    dom.editor.innerHTML = note.content || '';
  }

  // --- Tabs ---
  function renderTabs() {
    dom.tabsList.innerHTML = '';

    state.notes.forEach((note, idx) => {
      const tab = document.createElement('div');
      tab.className = `tab-btn ${note.id === state.activeNoteId ? 'active' : ''}`;
      tab.dataset.id = note.id;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'tab-title';
      titleSpan.textContent = note.title || `Ghi chú ${idx + 1}`;
      titleSpan.title = note.title || `Ghi chú ${idx + 1}`;
      tab.appendChild(titleSpan);

      // Close button if more than 1 note
      if (state.notes.length > 1) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Xóa ghi chú';
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteNote(note.id);
        });
        tab.appendChild(closeBtn);
      }

      tab.addEventListener('click', () => {
        if (state.activeNoteId !== note.id) {
          saveActiveNote();
          state.activeNoteId = note.id;
          renderTabs();
          loadActiveNote();
          dom.editor.focus();
        }
      });

      dom.tabsList.appendChild(tab);
    });
  }

  function updateTabLabel(noteId, title) {
    const tabEl = dom.tabsList.querySelector(`.tab-btn[data-id="${noteId}"] .tab-title`);
    if (tabEl) {
      tabEl.textContent = title;
      tabEl.title = title;
    }
  }

  function createNewNote() {
    saveActiveNote();
    const newId = 'note_' + Date.now();
    const newNote = {
      id: newId,
      title: `Ghi chú ${state.notes.length + 1}`,
      content: '',
      updatedAt: Date.now()
    };

    state.notes.push(newNote);
    state.activeNoteId = newId;
    saveActiveNote();
    renderTabs();
    loadActiveNote();
    dom.editor.focus();
    showToast('Đã tạo ghi chú mới');
  }

  function deleteNote(noteId) {
    if (state.notes.length <= 1) return;
    const confirmDel = confirm('Bạn có chắc muốn xóa ghi chú này?');
    if (!confirmDel) return;

    state.notes = state.notes.filter(n => n.id !== noteId);
    if (state.activeNoteId === noteId) {
      state.activeNoteId = state.notes[0].id;
    }

    saveActiveNote();
    renderTabs();
    loadActiveNote();
    showToast('Đã xóa ghi chú');
  }

  // --- Formatting (Docs style: Ctrl+B, Ctrl+I, Ctrl+U) ---
  function formatDoc(command) {
    document.execCommand(command, false, null);
    dom.editor.focus();
    updateFormatButtonStates();
    scheduleAutoSave();
  }

  function updateFormatButtonStates() {
    const isB = document.queryCommandState('bold');
    const isI = document.queryCommandState('italic');
    const isU = document.queryCommandState('underline');

    if (dom.btnBold) dom.btnBold.classList.toggle('active', isB);
    if (dom.btnItalic) dom.btnItalic.classList.toggle('active', isI);
    if (dom.btnUnderline) dom.btnUnderline.classList.toggle('active', isU);
  }

  // --- Copy & Download ---
  function copyAll() {
    const text = dom.editor.innerText;
    if (!text || !text.trim()) {
      showToast('Ghi chú trống');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      showToast('Đã sao chép vào bộ nhớ tạm');
    }).catch(() => {
      showToast('Không thể sao chép');
    });
  }

  function downloadNote() {
    const note = getActiveNote();
    const text = dom.editor.innerText;
    const cleanFilename = (note.title || 'note').replace(/[/\\?%*:|"<>]/g, '-').trim() || 'note';
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanFilename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải về máy');
  }

  // --- Toast ---
  let toastTimer = null;
  function showToast(msg) {
    if (!dom.toast) return;
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 1800);
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Editor typing
    dom.editor.addEventListener('input', () => {
      scheduleAutoSave();
    });

    // Clicking anywhere on the notebook card focuses the editor
    const editorCard = document.getElementById('editorCard');
    if (editorCard) {
      editorCard.addEventListener('click', (e) => {
        if (e.target === editorCard) {
          dom.editor.focus();
        }
      });
    }

    // Selection changes update B, I, U buttons
    document.addEventListener('selectionchange', () => {
      updateFormatButtonStates();
    });

    // Formatting button clicks
    dom.btnBold.addEventListener('click', (e) => {
      e.preventDefault();
      formatDoc('bold');
    });
    dom.btnItalic.addEventListener('click', (e) => {
      e.preventDefault();
      formatDoc('italic');
    });
    dom.btnUnderline.addEventListener('click', (e) => {
      e.preventDefault();
      formatDoc('underline');
    });

    // Add note
    dom.addNoteBtn.addEventListener('click', createNewNote);

    // Font select
    dom.fontSelect.addEventListener('change', (e) => {
      state.settings.font = e.target.value;
      applySettings();
      saveSettings();
    });

    // Font size controls
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

    // Utility actions
    dom.copyBtn.addEventListener('click', copyAll);
    dom.downloadBtn.addEventListener('click', downloadNote);

    // Clean paste (plain text only)
    dom.editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
      scheduleAutoSave();
    });

    // Global keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Tab)
    window.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // In đậm (Ctrl+B)
      if (isCmdOrCtrl && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        formatDoc('bold');
        return;
      }

      // In nghiêng (Ctrl+I)
      if (isCmdOrCtrl && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        formatDoc('italic');
        return;
      }

      // Gạch chân (Ctrl+U)
      if (isCmdOrCtrl && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        formatDoc('underline');
        return;
      }

      // Lưu tức thì (Ctrl+S)
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveActiveNote();
        showToast('Đã lưu');
        return;
      }

      // Sao chép nhanh (Ctrl+Shift+C)
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        copyAll();
        return;
      }

      // Phím Tab lùi dòng sạch sẽ
      if (e.key === 'Tab' && document.activeElement === dom.editor) {
        e.preventDefault();
        document.execCommand('insertText', false, '    ');
      }
    });
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
