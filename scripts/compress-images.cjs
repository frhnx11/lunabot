const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const backgroundsDir = path.join(__dirname, '../public/backgrounds');

const images = ['luna.jpg', 'jessica.jpg', 'iris.jpg', 'zuri.jpg'];

async function convertToWebP() {
  for (const image of images) {
    const inputPath = path.join(backgroundsDir, image);
    const outputPath = path.join(backgroundsDir, image.replace('.jpg', '.webp'));

    const stats = fs.statSync(inputPath);
    console.log(`Converting ${image} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    const newStats = fs.statSync(outputPath);
    console.log(`  -> ${image.replace('.jpg', '.webp')} (${(newStats.size / 1024).toFixed(0)} KB)`);
  }

  console.log('\nDone! You can now delete the original .jpg files.');
}

convertToWebP().catch(console.error);
