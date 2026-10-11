import { state, dom, generateNoteId } from './state.js';
import { showToast, downloadBlob } from './utils.js';
import { getActiveNote, saveCurrentNoteToMemory, persistNotesToStorage, scheduleAutoSave } from './storage.js';
import { updatePlaceholder, updateStats } from './editor.js';
import { renderTabs } from './tabs.js';
import { unselectImage } from './image.js';

export function copyAll() {
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

export function exportTxt() {
  saveCurrentNoteToMemory();
  const note = getActiveNote();
  const text = dom.editor.innerText;
  const title = (note.title || 'note').replace(/[/\\?%*:|"<>]/g, '-').trim() || 'note';
  downloadBlob(text, `${title}.txt`, 'text/plain;charset=utf-8');
  showToast('Downloaded .txt file');
}

export function exportMd() {
  saveCurrentNoteToMemory();
  const note = getActiveNote();
  const title = (note.title || 'note').replace(/[/\\?%*:|"<>]/g, '-').trim() || 'note';
  const md = htmlToMarkdown(note.title, dom.editor.innerHTML);
  downloadBlob(md, `${title}.md`, 'text/markdown;charset=utf-8');
  showToast('Downloaded Markdown .md file');
}

export function backupAllJson() {
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

export function handleImportJson(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);
      const rawNotes = Array.isArray(data) ? data : data.notes;

      if (Array.isArray(rawNotes) && rawNotes.length > 0) {
        if (confirm(`Found ${rawNotes.length} notes. Do you want to import them?`)) {
          unselectImage();
          const existingIds = new Set(state.notes.map(n => n.id));
          const sanitizedNotes = rawNotes.map(n => {
            const hasConflict = !n.id || existingIds.has(n.id);
            const id = hasConflict ? generateNoteId() : n.id;
            existingIds.add(id);
            return {
              id,
              title: n.title || 'Untitled Note',
              content: n.content || '',
              updatedAt: n.updatedAt || Date.now()
            };
          });

          state.notes = [...state.notes, ...sanitizedNotes];
          persistNotesToStorage();
          renderTabs();
          showToast(`Successfully imported ${sanitizedNotes.length} notes!`);
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

export function clearCurrentNote() {
  if (confirm('Are you sure you want to clear all content on this page?')) {
    unselectImage();
    dom.editor.innerHTML = '';
    updatePlaceholder();
    updateStats();
    scheduleAutoSave();
    showToast('Cleared page content');
  }
}

export function htmlToMarkdown(title, html) {
  let md = `# ${title || 'Untitled Note'}\n\n`;
  const temp = document.createElement('div');
  temp.innerHTML = html;

  temp.querySelectorAll('h1').forEach(el => { el.outerHTML = `\n# ${el.innerText}\n\n`; });
  temp.querySelectorAll('h2').forEach(el => { el.outerHTML = `\n## ${el.innerText}\n\n`; });
  temp.querySelectorAll('h3').forEach(el => { el.outerHTML = `\n### ${el.innerText}\n\n`; });
  temp.querySelectorAll('b, strong').forEach(el => { el.outerHTML = `**${el.innerText}**`; });
  temp.querySelectorAll('i, em').forEach(el => { el.outerHTML = `*${el.innerText}*`; });
  temp.querySelectorAll('u').forEach(el => { el.outerHTML = `_${el.innerText}_`; });
  temp.querySelectorAll('s, strike').forEach(el => { el.outerHTML = `~~${el.innerText}~~`; });
  temp.querySelectorAll('pre').forEach(el => { el.outerHTML = `\n\`\`\`\n${el.innerText}\n\`\`\`\n\n`; });
  temp.querySelectorAll('code').forEach(el => { el.outerHTML = `\`${el.innerText}\``; });
  temp.querySelectorAll('blockquote').forEach(el => { el.outerHTML = `\n> ${el.innerText}\n\n`; });
  temp.querySelectorAll('ul li').forEach(el => { el.outerHTML = `- ${el.innerText}\n`; });
  temp.querySelectorAll('ol li').forEach((el, i) => { el.outerHTML = `${i + 1}. ${el.innerText}\n`; });
  temp.querySelectorAll('hr').forEach(el => { el.outerHTML = `\n---\n\n`; });
  temp.querySelectorAll('img').forEach(el => {
    const alt = el.alt || 'image';
    const src = el.src || '';
    el.outerHTML = `\n![${alt}](${src})\n\n`;
  });

  md += temp.innerText.trim();
  return md;
}
