const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(
  "  const db = new Database(DB_PATH);\n  db.pragma('journal_mode = WAL');",
  `  let db;
  try {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  } catch (error) {
    console.error('Error opening database, possibly corrupted. Recreating...', error);
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
    if (fs.existsSync(DB_PATH + '-wal')) fs.unlinkSync(DB_PATH + '-wal');
    if (fs.existsSync(DB_PATH + '-shm')) fs.unlinkSync(DB_PATH + '-shm');
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }`
);

fs.writeFileSync('server.ts', content);
