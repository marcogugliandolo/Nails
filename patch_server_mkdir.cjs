const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');

const newContent = content.replace(
  "function initDB() {",
  "function initDB() {\n  const dir = path.dirname(DB_PATH);\n  if (!fs.existsSync(dir)) {\n    fs.mkdirSync(dir, { recursive: true });\n  }\n"
);

// wait, fs is not imported in server.ts
// so let's import it
const newContentWithFs = newContent.replace(
  "import path from 'path';",
  "import path from 'path';\nimport fs from 'fs';"
);

fs.writeFileSync('server.ts', newContentWithFs);
