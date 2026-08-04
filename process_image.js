import sharp from 'sharp';

async function processImage() {
  await sharp('public/icon.png')
    .resize({
      width: 512,
      height: 512,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })
    .toFile('public/icon_square.png');
}
processImage();
