import { state, dom } from './state.js';
import { updatePlaceholder } from './editor.js';
import { scheduleAutoSave } from './storage.js';

export function compressImageFile(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let result = canvas.toDataURL('image/webp', quality);
        if (!result || result.length < 50 || !result.startsWith('data:image/webp')) {
          result = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(result);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function insertResizableImage(src) {
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

export function selectImage(img) {
  if (!img) return;
  state.selectedImage = img;
  repositionResizer();
  if (dom.imageResizerBox) {
    dom.imageResizerBox.style.display = 'block';
  }
}

export function unselectImage() {
  if (state.isResizingImage) return;
  state.selectedImage = null;
  if (dom.imageResizerBox) {
    dom.imageResizerBox.style.display = 'none';
  }
}

export function repositionResizer() {
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

export function initImageResizerEvents() {
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
