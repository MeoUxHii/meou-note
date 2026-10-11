import { state, dom } from './state.js';
import { scheduleAutoSave } from './storage.js';
import { showToast } from './utils.js';

export function execFormat(command, value = null) {
  document.execCommand(command, false, value);
  dom.editor.focus();
  updateToolbarStates();
  scheduleAutoSave();
}

export function updateToolbarStates() {
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

export function handleMarkdownShortcuts(e) {
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
    replaceTriggerWithBlock(anchorNode, 1, 'H1');
  } else if (textBeforeCursor === '##') {
    e.preventDefault();
    replaceTriggerWithBlock(anchorNode, 2, 'H2');
  } else if (textBeforeCursor === '###') {
    e.preventDefault();
    replaceTriggerWithBlock(anchorNode, 3, 'H3');
  } else if (state.settings.autoDetectLists && (textBeforeCursor === '-' || textBeforeCursor === '*')) {
    e.preventDefault();
    replaceTriggerWithList(anchorNode, 1, 'insertUnorderedList');
  } else if (state.settings.autoDetectLists && textBeforeCursor === '1.') {
    e.preventDefault();
    replaceTriggerWithList(anchorNode, 2, 'insertOrderedList');
  } else if (textBeforeCursor === '>') {
    e.preventDefault();
    replaceTriggerWithQuote(anchorNode, 1);
  }
}

export function replaceTriggerWithBlock(node, triggerLen, tag) {
  node.textContent = node.textContent.slice(triggerLen).trimStart();
  try {
    document.execCommand('formatBlock', false, tag);
  } catch (_) {
    try {
      document.execCommand('formatBlock', false, `<${tag.toLowerCase()}>`);
    } catch (_) {}
  }
  scheduleAutoSave();
}

export function replaceTriggerWithQuote(node, triggerLen) {
  node.textContent = node.textContent.slice(triggerLen).trimStart();
  let formatted = false;
  try {
    formatted = document.execCommand('formatBlock', false, 'blockquote');
  } catch (_) {}

  if (!formatted) {
    try {
      formatted = document.execCommand('formatBlock', false, '<blockquote>');
    } catch (_) {}
  }

  if (!formatted) {
    try {
      const bq = document.createElement('blockquote');
      const parent = node.parentNode;
      if (parent && parent !== dom.editor) {
        parent.replaceWith(bq);
        bq.appendChild(node);
      } else {
        node.replaceWith(bq);
        bq.appendChild(node);
      }
    } catch (_) {}
  }
  scheduleAutoSave();
}

export function replaceTriggerWithList(node, triggerLen, listCommand) {
  node.textContent = node.textContent.slice(triggerLen).trimStart();
  document.execCommand(listCommand, false, null);
  scheduleAutoSave();
}

export function updatePlaceholder() {
  if (!dom.editor) return;
  const raw = dom.editor.innerHTML.trim();
  const text = (dom.editor.innerText || '').replace(/[\s\u200B\u00A0]/g, '');
  const hasImg = dom.editor.querySelector('img') !== null;

  const isEmpty = !hasImg && text.length === 0 && (!raw || raw === '<br>' || raw === '<div><br></div>' || raw === '<p><br></p>');

  if (isEmpty) {
    if (dom.editor.innerHTML !== '' && document.activeElement !== dom.editor) {
      dom.editor.innerHTML = '';
    }
    dom.editor.classList.add('is-empty');
  } else {
    dom.editor.classList.remove('is-empty');
  }
}

export function updateStats() {
  if (!dom.editor) return;
  const text = dom.editor.innerText || '';
  const cleanText = text.replace(/[\u200B\u00A0]/g, ' ').trim();
  const words = cleanText ? (cleanText.match(/\S+/g) || []).length : 0;
  const chars = cleanText ? cleanText.length : 0;

  const wordStr = words === 1 ? '1 word' : `${words.toLocaleString()} words`;
  const charStr = chars === 1 ? '1 character' : `${chars.toLocaleString()} characters`;

  if (dom.menuWordCount) {
    dom.menuWordCount.textContent = wordStr;
  }
  if (dom.statusWordCount) {
    dom.statusWordCount.textContent = wordStr;
  }
  if (dom.statusCharCount) {
    dom.statusCharCount.textContent = charStr;
  }
}

export function toggleFocusMode() {
  state.isFocusMode = !state.isFocusMode;
  dom.appLayout.classList.toggle('focus-mode', state.isFocusMode);
  if (state.isFocusMode) {
    showToast('Zen Focus Mode (Press F10 or Esc to exit)');
  }
}

export function exitFocusMode() {
  if (state.isFocusMode) {
    state.isFocusMode = false;
    dom.appLayout.classList.remove('focus-mode');
  }
}
