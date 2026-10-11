const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tempBundle = path.resolve(__dirname, '../.temp-bundle.js');
const outputFile = path.resolve(__dirname, '../app.js');

try {
  console.log('[build-js] Bundling src/main.js with esbuild...');
  execSync(`npx esbuild src/main.js --bundle --outfile="${tempBundle}"`, { stdio: 'inherit' });

  console.log('[build-js] Obfuscating bundle into app.js...');
  execSync(`npx javascript-obfuscator "${tempBundle}" --output "${outputFile}" --compact true --self-defending true --disable-console-output true --debug-protection true --debug-protection-interval 2000 --string-array true --string-array-encoding base64 --split-strings true --source-map false`, { stdio: 'inherit' });

  if (fs.existsSync(tempBundle)) {
    fs.unlinkSync(tempBundle);
  }
  console.log('[build-js] Successfully generated app.js without keeping large bundle in root.');
} catch (err) {
  if (fs.existsSync(tempBundle)) {
    fs.unlinkSync(tempBundle);
  }
  console.error('[build-js] Build failed:', err.message);
  process.exit(1);
}
