// Script to generate placeholder icons
// Run this with Node.js to create simple icon files
// You can also replace these with your own icons

const fs = require('fs');
const path = require('path');

// Simple 1x1 pixel PNG placeholder (gray)
// Real icons should be 16x16, 48x48, 128x128 pixels
const placeholder16 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAEklEQVQ4y2NgGAWjYBSMAlGBAQA13gEB2vK0LwAAAABJRU5ErkJggg==', 'base64');
const placeholder48 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAWklEQVR4Ae3SMREAIBDAwF+xgzMYwAEcwAEOYAADGIABGMAABjCAAQxgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZ='.split('').reverse().join(''), 'base64');
const placeholder128 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAATklEQVR4Ae3SMREAIBDAwF+xgzMYwAEcwAEOYAADGIABGMAABjCAAQxgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZgAAZ', 'base64');

const iconsDir = path.join(__dirname, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), placeholder16);
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), placeholder48);
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), placeholder128);

console.log('Placeholder icons created. Replace with real icons for production.');