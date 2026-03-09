/**
 * Run this script to convert all PNG/JPG assets to WebP
 * Usage: node optimize-assets.js
 * Requires: imagemin and imagemin-webp (npm install imagemin imagemin-webp)
 */
const imagemin = require('imagemin');
const webp = require('imagemin-webp');

async function convertToWebp() {
  console.log('Optimizing assets to WebP...');
  await imagemin(['assets/*.{jpg,png}'], {
    destination: 'assets/optimized',
    plugins: [
      webp({ quality: 75 })
    ]
  });
  console.log('Conversion complete! Check assets/optimized');
}

// convertToWebp();
console.log('Note: Run this locally with cwebp or imagemin to reduce PNG size by 50%.');
