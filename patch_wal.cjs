const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(
  "const db = new Database(DB_PATH);",
  "const db = new Database(DB_PATH);\n  db.pragma('journal_mode = WAL');"
);

fs.writeFileSync('server.ts', content);
