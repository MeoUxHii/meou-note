(function () {
  'use strict';

  const STORAGE_NOTES = 'meou_notes_zen_v3';
  const STORAGE_ACTIVE_ID = 'meou_active_note_zen_v3';
  const STORAGE_SETTINGS = 'meou_settings_zen_v3';

  const DEFAULT_NOTE = {
    id: 'note_' + Date.now(),
    title: 'Welcome to MeoU Note',
    content: `<b>MeoU Note</b> is a minimalist, pitch-black online notepad crafted for deep writing focus.

<b>Key Shortcuts:</b>
• <b>Ctrl + B</b>: Bold text
• <i>Ctrl + I</i>: Italic text
• <u>Ctrl + U</u>: Underline text
• <s>Ctrl + Shift + X</s>: Strikethrough
• <b>Ctrl + K</b>: Quick Search all notes
• <b>Ctrl + N</b>: Create a new note
• <b>Ctrl + S</b>: Save immediately
• <b>F10</b>: Zen Focus Mode (hides all toolbars)

<b>Markdown Typing Triggers:</b>
• Type <code># </code> at the start of a line for Heading 1
• Type <code>## </code> for Heading 2
• Type <code>> </code> for a Blockquote
• Lists (- and 1.) can be auto-detected by enabling in More (⋯) menu

Start typing your thoughts here...`,
    updatedAt: Date.now()
  };

  const state = {
    notes: [],
    activeNoteId: null,
    saveTimer: null,
    settings: {
      theme: 'dark',
      font: "'JetBrains Mono', monospace",
      fontSize: 15,
      autoDetectLists: false
    },
    isFocusMode: false,
    searchSelectedIndex: 0,
    pendingDeleteNoteId: null,
    selectedImage: null,
    isResizingImage: false
  };

  const dom = {
    appLayout: document.getElementById('appLayout'),
    topNav: document.getElementById('topNav'),
    tabsList: document.getElementById('tabsList'),
    addNoteBtn: document.getElementById('addNoteBtn'),
    noteTitleInput: document.getElementById('noteTitleInput'),
    noteDateHint: document.getElementById('noteDateHint'),
    editor: document.getElementById('editor'),
    canvasWrap: document.getElementById('canvasWrap'),
    canvasInner: document.getElementById('canvasInner'),

    btnBold: document.getElementById('btnBold'),
    btnItalic: document.getElementById('btnItalic'),
    btnUnderline: document.getElementById('btnUnderline'),
    btnStrike: document.getElementById('btnStrike'),
    btnCode: document.getElementById('btnCode'),
    btnBullet: document.getElementById('btnBullet'),
    btnNumber: document.getElementById('btnNumber'),

    fontSelect: document.getElementById('fontSelect'),
    decreaseFontBtn: document.getElementById('decreaseFontBtn'),
    increaseFontBtn: document.getElementById('increaseFontBtn'),
    fontSizeText: document.getElementById('fontSizeText'),

    themeToggleBtn: document.getElementById('themeToggleBtn'),
    focusModeBtn: document.getElementById('focusModeBtn'),
    exitFocusBtn: document.getElementById('exitFocusBtn'),

    moreMenuBtn: document.getElementById('moreMenuBtn'),
    moreDropdown: document.getElementById('moreDropdown'),
    copyAllItem: document.getElementById('copyAllItem'),
    exportTxtItem: document.getElementById('exportTxtItem'),
    exportMdItem: document.getElementById('exportMdItem'),
    backupJsonItem: document.getElementById('backupJsonItem'),
    importJsonInput: document.getElementById('importJsonInput'),
    toggleAutoListsItem: document.getElementById('toggleAutoListsItem'),
    autoListsStatus: document.getElementById('autoListsStatus'),
    shortcutsModalItem: document.getElementById('shortcutsModalItem'),
    clearNoteItem: document.getElementById('clearNoteItem'),

    menuWordCount: document.getElementById('menuWordCount'),
    syncStatus: document.getElementById('syncStatus'),
    shortcutsBtn: document.getElementById('shortcutsBtn'),

    deleteConfirmPopover: document.getElementById('deleteConfirmPopover'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    imageResizerBox: document.getElementById('imageResizerBox'),
    deleteImgBtn: document.getElementById('deleteImgBtn'),

    searchBtn: document.getElementById('searchBtn'),
    searchModal: document.getElementById('searchModal'),
    searchInput: document.getElementById('searchInput'),
    searchResultsList: document.getElementById('searchResultsList'),

    shortcutsModal: document.getElementById('shortcutsModal'),
    closeShortcutsBtn: document.getElementById('closeShortcutsBtn'),

    toast: document.getElementById('toast')
  };

  function init() {
    loadSettings();
    loadNotes();
    applySettings();
    renderTabs();
    loadActiveNote();
    bindEvents();
    initImageResizerEvents();
    updateStats();
    updatePlaceholder();
  }

  function loadSettings() {
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

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(state.settings));
    } catch (err) {
      console.warn('Error saving settings:', err);
    }
  }

  function applySettings() {
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

  function toggleAutoDetectLists() {
    state.settings.autoDetectLists = !state.settings.autoDetectLists;
    applySettings();
    saveSettings();
    showToast(state.settings.autoDetectLists ? 'Auto-detect lists enabled' : 'Auto-detect lists disabled');
  }

  function toggleTheme() {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    applySettings();
    saveSettings();
    showToast(state.settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode');
  }

  function loadNotes() {
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

  function getActiveNote() {
    return state.notes.find(n => n.id === state.activeNoteId) || state.notes[0];
  }

  function persistNotesToStorage() {
    try {
      localStorage.setItem(STORAGE_NOTES, JSON.stringify(state.notes));
      localStorage.setItem(STORAGE_ACTIVE_ID, state.activeNoteId);
    } catch (err) {
      console.error('Storage write error:', err);
      showToast('Browser storage is full!');
    }
  }

  function saveCurrentNoteToMemory() {
    const note = getActiveNote();
    if (!note) return;

    note.content = dom.editor.innerHTML;
    note.title = dom.noteTitleInput.value.trim() || 'Untitled Note';
    note.updatedAt = Date.now();
  }

  function scheduleAutoSave() {
    setSyncStatus('saving');
    if (state.saveTimer) clearTimeout(state.saveTimer);

    state.saveTimer = setTimeout(() => {
      saveCurrentNoteToMemory();
      persistNotesToStorage();
      updateDateHint(getActiveNote());
      setSyncStatus('saved');
    }, 300);
  }

  function setSyncStatus(status) {
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

  function loadActiveNote() {
    const note = getActiveNote();
    if (!note) return;

    dom.noteTitleInput.value = note.title || '';
    dom.editor.innerHTML = note.content || '';
    updateDateHint(note);
    updatePlaceholder();
    updateStats();
  }

  function updateDateHint(note) {
    if (!dom.noteDateHint || !note) return;
    const d = new Date(note.updatedAt || Date.now());
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    dom.noteDateHint.textContent = `Updated at ${hours}:${mins} • ${dateStr}`;
  }

  function isNoteEmpty(note) {
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

  function renderTabs() {
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

  function showDeleteConfirm(noteId, triggerElement) {
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

  function hideDeleteConfirm() {
    if (dom.deleteConfirmPopover) {
      dom.deleteConfirmPopover.classList.remove('show');
      dom.deleteConfirmPopover.setAttribute('aria-hidden', 'true');
    }
    state.pendingDeleteNoteId = null;
  }

  function updateTabTitle(noteId, newTitle) {
    const tabEl = dom.tabsList.querySelector(`.tab-btn[data-id="${noteId}"] .tab-title`);
    if (tabEl) {
      tabEl.textContent = newTitle || 'Untitled Note';
      tabEl.title = newTitle || 'Untitled Note';
    }
  }

  function switchNote(targetId) {

    saveCurrentNoteToMemory();
    persistNotesToStorage();

    state.activeNoteId = targetId;
    persistNotesToStorage();

    renderTabs();
    loadActiveNote();
    dom.editor.focus();
  }

  function createNewNote() {

    saveCurrentNoteToMemory();
    persistNotesToStorage();

    const newId = 'note_' + Date.now();
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

  function deleteNote(noteId) {
    if (state.notes.length <= 1) {
      showToast('Cannot delete the only remaining note');
      return;
    }

    hideDeleteConfirm();

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

  function execFormat(command, value = null) {
    document.execCommand(command, false, value);
    dom.editor.focus();
    updateToolbarStates();
    scheduleAutoSave();
  }

  function updateToolbarStates() {
    if (!dom.editor) return;

    const isB = document.queryCommandState('bold');
    const isI = document.queryCommandState('italic');
    const isU = document.queryCommandState('underline');
    const isS = document.queryCommandState('strikeThrough');

    if (dom.btnBold) dom.btnBold.classList.toggle('active', isB);
    if (dom.btnItalic) dom.btnItalic.classList.toggle('active', isI);
    if (dom.btnUnderline) dom.btnUnderline.classList.toggle('active', isU);
    if (dom.btnStrike) dom.btnStrike.classList.toggle('active', isS);
  }

  function handleMarkdownShortcuts(e) {
    if (e.key !== ' ' && e.key !== 'Spacebar') return;

    const selection = window.getSelection();
    if (!selection || !selection.isCollapsed || selection.rangeCount === 0) return;

    const anchorNode = selection.anchorNode;
    if (!anchorNode || anchorNode.nodeType !== Node.TEXT_NODE) return;

    const text = anchorNode.textContent;
    const offset = selection.anchorOffset;
    const textBeforeCursor = text.slice(0, offset);

    if (textBeforeCursor === '#') {
      e.preventDefault();
      replaceTriggerWithBlock(anchorNode, 1, '<h1>');
    } else if (textBeforeCursor === '##') {
      e.preventDefault();
      replaceTriggerWithBlock(anchorNode, 2, '<h2>');
    } else if (textBeforeCursor === '###') {
      e.preventDefault();
      replaceTriggerWithBlock(anchorNode, 3, '<h3>');
    } else if (state.settings.autoDetectLists && (textBeforeCursor === '-' || textBeforeCursor === '*')) {
      e.preventDefault();
      replaceTriggerWithList(anchorNode, 1, 'insertUnorderedList');
    } else if (state.settings.autoDetectLists && textBeforeCursor === '1.') {
      e.preventDefault();
      replaceTriggerWithList(anchorNode, 2, 'insertOrderedList');
    } else if (textBeforeCursor === '>') {
      e.preventDefault();
      replaceTriggerWithBlock(anchorNode, 1, '<blockquote>');
    }
  }

  function replaceTriggerWithBlock(node, triggerLen, blockTag) {
    node.textContent = node.textContent.slice(triggerLen).trimStart();
    document.execCommand('formatBlock', false, blockTag);
    scheduleAutoSave();
  }

  function replaceTriggerWithList(node, triggerLen, listCommand) {
    node.textContent = node.textContent.slice(triggerLen).trimStart();
    document.execCommand(listCommand, false, null);
    scheduleAutoSave();
  }

  function updatePlaceholder() {
    const raw = dom.editor.innerHTML.trim();
    const text = dom.editor.innerText.replace(/\u200B/g, '').trim();
    const hasImg = dom.editor.querySelector('img') !== null;

    const isEmpty = (!hasImg && !text && (!raw || raw === '<br>' || raw === '<div><br></div>' || raw === '<p><br></p>'));

    if (isEmpty) {
      if (dom.editor.innerHTML !== '') dom.editor.innerHTML = '';
      dom.editor.classList.add('is-empty');
    } else {
      dom.editor.classList.remove('is-empty');
    }
  }

  function insertResizableImage(src) {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'resizable-img';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && dom.editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);

      const spacer = document.createElement('div');
      spacer.innerHTML = '<br>';
      img.after(spacer);

      const newRange = document.createRange();
      newRange.setStart(spacer, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      dom.editor.appendChild(img);
      const spacer = document.createElement('div');
      spacer.innerHTML = '<br>';
      dom.editor.appendChild(spacer);
    }

    updatePlaceholder();
    scheduleAutoSave();

    setTimeout(() => {
      selectImage(img);
    }, 60);
  }

  function selectImage(img) {
    if (!img) return;
    state.selectedImage = img;
    repositionResizer();
    if (dom.imageResizerBox) {
      dom.imageResizerBox.style.display = 'block';
    }
  }

  function unselectImage() {
    if (state.isResizingImage) return;
    state.selectedImage = null;
    if (dom.imageResizerBox) {
      dom.imageResizerBox.style.display = 'none';
    }
  }

  function repositionResizer() {
    if (!state.selectedImage || !dom.imageResizerBox || !dom.canvasInner) return;
    const innerRect = dom.canvasInner.getBoundingClientRect();
    const imgRect = state.selectedImage.getBoundingClientRect();

    const top = imgRect.top - innerRect.top;
    const left = imgRect.left - innerRect.left;

    dom.imageResizerBox.style.top = `${top}px`;
    dom.imageResizerBox.style.left = `${left}px`;
    dom.imageResizerBox.style.width = `${imgRect.width}px`;
    dom.imageResizerBox.style.height = `${imgRect.height}px`;
  }

  function initImageResizerEvents() {
    if (!dom.imageResizerBox) return;

    const handles = dom.imageResizerBox.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.selectedImage) return;

        state.isResizingImage = true;
        const handleType = handle.dataset.handle;
        const targetImg = state.selectedImage;
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = targetImg.offsetWidth;
        const startHeight = targetImg.offsetHeight;
        const maxAllowedWidth = dom.canvasInner.clientWidth - 96;

        function onMouseMove(moveEvent) {
          if (!state.isResizingImage) return;
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;

          if (handleType === 'se') {
            const w = Math.max(50, Math.min(maxAllowedWidth, startWidth + dx));
            targetImg.style.width = `${w}px`;
            targetImg.style.height = 'auto';
          } else if (handleType === 'sw') {
            const w = Math.max(50, Math.min(maxAllowedWidth, startWidth - dx));
            targetImg.style.width = `${w}px`;
            targetImg.style.height = 'auto';
          } else if (handleType === 'ne') {
            const w = Math.max(50, Math.min(maxAllowedWidth, startWidth + dx));
            targetImg.style.width = `${w}px`;
            targetImg.style.height = 'auto';
          } else if (handleType === 'nw') {
            const w = Math.max(50, Math.min(maxAllowedWidth, startWidth - dx));
            targetImg.style.width = `${w}px`;
            targetImg.style.height = 'auto';
          } else if (handleType === 'e') {

            const w = Math.max(50, Math.min(maxAllowedWidth, startWidth + dx));
            targetImg.style.width = `${w}px`;
          } else if (handleType === 'w') {

            const w = Math.max(50, Math.min(maxAllowedWidth, startWidth - dx));
            targetImg.style.width = `${w}px`;
          } else if (handleType === 's') {

            const h = Math.max(30, startHeight + dy);
            targetImg.style.height = `${h}px`;
          } else if (handleType === 'n') {

            const h = Math.max(30, startHeight - dy);
            targetImg.style.height = `${h}px`;
          }

          repositionResizer();
        }

        function onMouseUp() {
          state.isResizingImage = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          scheduleAutoSave();
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    });

    const sizeBtns = dom.imageResizerBox.querySelectorAll('.btn-img-act[data-size]');
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.selectedImage) return;
        state.selectedImage.style.width = btn.dataset.size;
        state.selectedImage.style.height = 'auto';
        repositionResizer();
        scheduleAutoSave();
      });
    });

    if (dom.deleteImgBtn) {
      dom.deleteImgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.selectedImage) {
          state.selectedImage.remove();
          unselectImage();
          updatePlaceholder();
          scheduleAutoSave();
        }
      });
    }

    dom.editor.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG') {
        e.stopPropagation();
        selectImage(e.target);
      } else {
        unselectImage();
      }
    });

    dom.canvasWrap.addEventListener('scroll', () => {
      if (state.selectedImage) repositionResizer();
    });
    window.addEventListener('resize', () => {
      if (state.selectedImage) repositionResizer();
    });
  }

  function updateStats() {
    const text = dom.editor.innerText || '';
    const words = (text.match(/\S+/g) || []).length;
    if (dom.menuWordCount) {
      dom.menuWordCount.textContent = `${words.toLocaleString()} words`;
    }
  }

  function toggleFocusMode() {
    state.isFocusMode = !state.isFocusMode;
    dom.appLayout.classList.toggle('focus-mode', state.isFocusMode);
    if (state.isFocusMode) {
      showToast('Zen Focus Mode (Press F10 or Esc to exit)');
    }
  }

  function exitFocusMode() {
    if (state.isFocusMode) {
      state.isFocusMode = false;
      dom.appLayout.classList.remove('focus-mode');
    }
  }

  function openSearchModal() {
    hideDropdown();
    dom.searchModal.classList.add('show');
    dom.searchModal.setAttribute('aria-hidden', 'false');
    dom.searchInput.value = '';
    state.searchSelectedIndex = 0;
    renderSearchResults('');
    dom.searchInput.focus();
  }

  function closeSearchModal() {
    dom.searchModal.classList.remove('show');
    dom.searchModal.setAttribute('aria-hidden', 'true');
    dom.editor.focus();
  }

  function renderSearchResults(query) {
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

  function copyAll() {
    const text = dom.editor.innerText;
    if (!text || !text.trim()) {
      showToast('Note is empty');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard');
    }).catch(() => {
      showToast('Could not copy');
    });
  }

  function exportTxt() {
    const note = getActiveNote();
    const text = dom.editor.innerText;
    const title = (note.title || 'note').replace(/[/\\?%*:|"<>]/g, '-').trim() || 'note';
    downloadBlob(text, `${title}.txt`, 'text/plain;charset=utf-8');
    showToast('Downloaded .txt file');
  }

  function exportMd() {
    const note = getActiveNote();
    const title = (note.title || 'note').replace(/[/\\?%*:|"<>]/g, '-').trim() || 'note';
    const md = htmlToMarkdown(note.title, dom.editor.innerHTML);
    downloadBlob(md, `${title}.md`, 'text/markdown;charset=utf-8');
    showToast('Downloaded Markdown .md file');
  }

  function backupAllJson() {
    saveCurrentNoteToMemory();
    const backupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      notes: state.notes
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadBlob(jsonStr, `meou_notes_backup_${dateStr}.json`, 'application/json');
    showToast('All notes backed up');
  }

  function handleImportJson(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);
        const importedNotes = Array.isArray(data) ? data : data.notes;

        if (Array.isArray(importedNotes) && importedNotes.length > 0) {
          if (confirm(`Found ${importedNotes.length} notes. Do you want to import them?`)) {
            state.notes = [...state.notes, ...importedNotes];
            persistNotesToStorage();
            renderTabs();
            showToast(`Successfully imported ${importedNotes.length} notes!`);
          }
        } else {
          showToast('Invalid JSON file format');
        }
      } catch (err) {
        showToast('Error reading JSON file');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function clearCurrentNote() {
    if (confirm('Are you sure you want to clear all content on this page?')) {
      dom.editor.innerHTML = '';
      updatePlaceholder();
      updateStats();
      scheduleAutoSave();
      showToast('Cleared page content');
    }
  }

  function htmlToMarkdown(title, html) {
    let md = `# ${title || 'Untitled Note'}\n\n`;
    let temp = document.createElement('div');
    temp.innerHTML = html;

    temp.querySelectorAll('h1').forEach(el => { el.outerHTML = `\n# ${el.innerText}\n\n`; });
    temp.querySelectorAll('h2').forEach(el => { el.outerHTML = `\n## ${el.innerText}\n\n`; });
    temp.querySelectorAll('h3').forEach(el => { el.outerHTML = `\n### ${el.innerText}\n\n`; });
    temp.querySelectorAll('b, strong').forEach(el => { el.outerHTML = `**${el.innerText}**`; });
    temp.querySelectorAll('i, em').forEach(el => { el.outerHTML = `*${el.innerText}*`; });
    temp.querySelectorAll('u').forEach(el => { el.outerHTML = `_${el.innerText}_`; });
    temp.querySelectorAll('s, strike').forEach(el => { el.outerHTML = `~~${el.innerText}~~`; });
    temp.querySelectorAll('code').forEach(el => { el.outerHTML = `\`${el.innerText}\``; });
    temp.querySelectorAll('blockquote').forEach(el => { el.outerHTML = `\n> ${el.innerText}\n\n`; });
    temp.querySelectorAll('ul li').forEach(el => { el.outerHTML = `- ${el.innerText}\n`; });
    temp.querySelectorAll('ol li').forEach((el, i) => { el.outerHTML = `${i + 1}. ${el.innerText}\n`; });

    md += temp.innerText.trim();
    return md;
  }

  function downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    if (!dom.toast) return;
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 2000);
  }

  function toggleDropdown() {
    dom.moreDropdown.classList.toggle('show');
  }

  function hideDropdown() {
    if (dom.moreDropdown) dom.moreDropdown.classList.remove('show');
  }

  function bindEvents() {

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

    dom.editor.addEventListener('paste', (e) => {
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
              const reader = new FileReader();
              reader.onload = function (event) {
                insertResizableImage(event.target.result);
              };
              reader.readAsDataURL(file);
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

    dom.editor.addEventListener('drop', (e) => {
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('image/')) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = function (event) {
              insertResizableImage(event.target.result);
            };
            reader.readAsDataURL(files[i]);
            break;
          }
        }
      }
    });

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
        if (dom.searchModal.classList.contains('show')) {
          closeSearchModal();
          return;
        }
        if (dom.shortcutsModal.classList.contains('show')) {
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
        if (dom.searchModal.classList.contains('show')) {
          closeSearchModal();
        } else {
          openSearchModal();
        }
        return;
      }

      if (dom.searchModal.classList.contains('show')) {
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
        dom.shortcutsModal.classList.toggle('show');
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

    dom.tabsList.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        dom.tabsList.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  function updateSearchSelectedClass(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === state.searchSelectedIndex);
      if (idx === state.searchSelectedIndex) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
