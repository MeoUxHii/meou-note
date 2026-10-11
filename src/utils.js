import { dom } from './state.js';

let toastTimer = null;

export function showToast(msg) {
  if (!dom.toast) return;
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, 2000);
}

export function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

export function downloadBlob(content, filename, contentType) {
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
