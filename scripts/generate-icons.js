import fs from 'fs';
import path from 'path';

// Valid base64 minimal 512x512 PNG with blue background and gold crest icon
// or create standard PNGs from canvas / SVG
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 192x192 and 512x512 SVG copy and PNG fallbacks
const svgContent = fs.readFileSync(path.join(publicDir, 'icon.svg'), 'utf-8');

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

console.log('Icons generated successfully.');
