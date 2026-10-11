const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function rebuildJs() {
  try {
    execSync('node scripts/build-js.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('[watch] JS build error:', err.message);
  }
}

console.log('[watch] Watching src/ for changes...');

let jsTimeout;
fs.watch(path.resolve(__dirname, '../src'), { recursive: true }, (event, filename) => {
  if (filename && filename.endsWith('.js')) {
    clearTimeout(jsTimeout);
    jsTimeout = setTimeout(() => {
      console.log(`[watch] JS source changed: ${filename}`);
      rebuildJs();
    }, 100);
  }
});
