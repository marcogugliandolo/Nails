import fs from 'fs';
import https from 'https';
import http from 'http';

const url = 'https://nube.marcogugliandolo.com/s/FZWwcYLoqfJerq5/download';

function download(urlPath, dest) {
  return new Promise((resolve, reject) => {
    const lib = urlPath.startsWith('https') ? https : http;
    lib.get(urlPath, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      
      console.log('Final URL headers:', res.headers['content-type']);
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
});
