export const STORAGE_NOTES = 'meou_notes_zen_v3';
export const STORAGE_ACTIVE_ID = 'meou_active_note_zen_v3';
export const STORAGE_SETTINGS = 'meou_settings_zen_v3';

export function generateNoteId() {
  return 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

export const DEFAULT_NOTE = {
  id: generateNoteId(),
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

export const state = {
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

export const dom = {};

export function initDom() {
  const ids = [
    'appLayout', 'topNav', 'tabsList', 'addNoteBtn', 'noteTitleInput', 'noteDateHint',
    'editor', 'canvasWrap', 'canvasInner', 'btnBold', 'btnItalic', 'btnUnderline',
    'btnStrike', 'btnCode', 'btnBullet', 'btnNumber', 'fontSelect', 'decreaseFontBtn',
    'increaseFontBtn', 'fontSizeText', 'themeToggleBtn', 'focusModeBtn', 'exitFocusBtn',
    'moreMenuBtn', 'moreDropdown', 'copyAllItem', 'exportTxtItem', 'exportMdItem',
    'backupJsonItem', 'importJsonInput', 'toggleAutoListsItem', 'autoListsStatus',
    'shortcutsModalItem', 'clearNoteItem', 'menuWordCount', 'statusWordCount', 'statusCharCount',
    'syncStatus', 'shortcutsBtn', 'deleteConfirmPopover', 'cancelDeleteBtn', 'confirmDeleteBtn',
    'imageResizerBox', 'deleteImgBtn', 'searchBtn', 'searchModal', 'searchInput', 'searchResultsList',
    'shortcutsModal', 'closeShortcutsBtn', 'toast'
  ];
  ids.forEach(id => {
    dom[id] = document.getElementById(id);
  });
}
