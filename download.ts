import fs from 'fs';
import https from 'https';

const url = 'https://nube.marcogugliandolo.com/s/FZWwcYLoqfJerq5/download';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

download(url, './public/icon.png').then(() => {
  console.log('Icon downloaded successfully.');
}).catch((err) => {
  console.error('Download failed:', err);
});
