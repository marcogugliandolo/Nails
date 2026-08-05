const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

// Replace sqlite and sqlite3 imports and initDB with better-sqlite3

content = content.replace(
  /import sqlite3 from 'sqlite3';[\s\S]*?async function startServer\(\) {/m,
  `import Database from 'better-sqlite3';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.sqlite');

function initDB() {
  const db = new Database(DB_PATH);

  db.exec(\`
    CREATE TABLE IF NOT EXISTS store (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  \`);

  const defaults = {
    bookings: [],
    services: [
      { id: 'manicura', name: 'Manicura Clásica', duration: '45 MIN', price: '15€', img: 'https://upload.wikimedia.org/wikipedia/commons/8/88/French_manicure_with_silver_nail_polish.jpg' },
      { id: 'pedicura', name: 'Pedicura Spa', duration: '60 MIN', price: '25€', img: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Pink_nails_and_glitter_manicure.jpg' },
      { id: 'acrilicas', name: 'Uñas Acrílicas', duration: '90 MIN', price: '35€', img: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Acrylic_nail_art_with_crystal.jpg' },
      { id: 'nailart', name: 'Nail Art', duration: '120 MIN', price: '45€', img: 'https://upload.wikimedia.org/wikipedia/commons/3/36/UV_manicure_lamps_%2815157277325%29.jpg' },
    ],
    products: [
      { id: '1', name: 'Aceite de Cutículas', price: '12€', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=60' },
      { id: '2', name: 'Crema Hidratante Manos', price: '18€', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=60' },
      { id: '3', name: 'Set Herramientas Básicas', price: '25€', img: 'https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?auto=format&fit=crop&w=500&q=60' }
    ],
    blockedSlots: []
  };

  const stmt = db.prepare('SELECT value FROM store WHERE key = ?');
  const insert = db.prepare('INSERT INTO store (key, value) VALUES (?, ?)');

  for (const [key, value] of Object.entries(defaults)) {
    const row = stmt.get(key);
    if (!row) {
      insert.run(key, JSON.stringify(value));
    }
  }

  return db;
}

async function startServer() {`
);

content = content.replace(
  /const db = await initDB\(\);\s+const getStore = async \(key\) => {[\s\S]*?const setStore = async \(key, value\) => {[\s\S]*?};/,
  `const db = initDB();
  
  const getStore = (key) => {
    const row = db.prepare('SELECT value FROM store WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : [];
  };
  
  const setStore = (key, value) => {
    db.prepare('UPDATE store SET value = ? WHERE key = ?').run(JSON.stringify(value), key);
  };`
);

// We need to change the await getStore and await setStore to just getStore and setStore since they are now sync
content = content.replace(/await getStore/g, 'getStore');
content = content.replace(/await setStore/g, 'setStore');

fs.writeFileSync('server.ts', content);
