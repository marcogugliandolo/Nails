const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');

// Use simple string replacement to replace the beginning part
let newContent = content.replace(
  /let bookings: any\[\] = \[\];[\s\S]*?async function startServer\(\) {/m,
  `import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.sqlite');

async function initDB() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.exec(\`
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

  for (const [key, value] of Object.entries(defaults)) {
    const row = await db.get('SELECT value FROM store WHERE key = ?', [key]);
    if (!row) {
      await db.run('INSERT INTO store (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
    }
  }

  return db;
}

async function startServer() {
  const db = await initDB();
  
  const getStore = async (key) => {
    const row = await db.get('SELECT value FROM store WHERE key = ?', [key]);
    return row ? JSON.parse(row.value) : [];
  };
  
  const setStore = async (key, value) => {
    await db.run('UPDATE store SET value = ? WHERE key = ?', [JSON.stringify(value), key]);
  };
`
);

// We need to replace the route handlers to use async functions and `getStore`/`setStore`.
// E.g. app.get('/api/services', (req, res) => res.json(services)); -> app.get('/api/services', async (req, res) => res.json(await getStore('services')));
newContent = newContent.replace(
  "app.get('/api/services', (req, res) => res.json(services));",
  "app.get('/api/services', async (req, res) => res.json(await getStore('services')));"
);

newContent = newContent.replace(
  "app.put('/api/services', (req, res) => {\n    services = req.body.services;\n    res.json({ success: true, services });\n  });",
  "app.put('/api/services', async (req, res) => {\n    const services = req.body.services;\n    await setStore('services', services);\n    res.json({ success: true, services });\n  });"
);

newContent = newContent.replace(
  "app.get('/api/products', (req, res) => res.json(products));",
  "app.get('/api/products', async (req, res) => res.json(await getStore('products')));"
);

newContent = newContent.replace(
  "app.put('/api/products', (req, res) => {\n    products = req.body.products;\n    res.json({ success: true, products });\n  });",
  "app.put('/api/products', async (req, res) => {\n    const products = req.body.products;\n    await setStore('products', products);\n    res.json({ success: true, products });\n  });"
);

newContent = newContent.replace(
  "app.get('/api/blocked-slots', (req, res) => res.json(blockedSlots));",
  "app.get('/api/blocked-slots', async (req, res) => res.json(await getStore('blockedSlots')));"
);

newContent = newContent.replace(
  "app.post('/api/blocked-slots', (req, res) => {\n    const { date, time } = req.body;\n    const newBlocked = { id: Date.now().toString(), date, time };\n    blockedSlots.push(newBlocked);\n    res.json({ success: true, blockedSlot: newBlocked });\n  });",
  "app.post('/api/blocked-slots', async (req, res) => {\n    const { date, time } = req.body;\n    const newBlocked = { id: Date.now().toString(), date, time };\n    const blockedSlots = await getStore('blockedSlots');\n    blockedSlots.push(newBlocked);\n    await setStore('blockedSlots', blockedSlots);\n    res.json({ success: true, blockedSlot: newBlocked });\n  });"
);

newContent = newContent.replace(
  "app.delete('/api/blocked-slots/:id', (req, res) => {\n    blockedSlots = blockedSlots.filter(s => s.id !== req.params.id);\n    res.json({ success: true });\n  });",
  "app.delete('/api/blocked-slots/:id', async (req, res) => {\n    let blockedSlots = await getStore('blockedSlots');\n    blockedSlots = blockedSlots.filter(s => s.id !== req.params.id);\n    await setStore('blockedSlots', blockedSlots);\n    res.json({ success: true });\n  });"
);

newContent = newContent.replace(
  "app.get('/api/bookings', (req, res) => {\n    res.json(bookings);\n  });",
  "app.get('/api/bookings', async (req, res) => {\n    res.json(await getStore('bookings'));\n  });"
);

// We need to inject fetching blockedSlots and bookings inside app.post('/api/bookings')
newContent = newContent.replace(
  /const { name, email, date, time, service, paidInAdvance } = req.body;[\s\S]*?if \(!name \|\| !email \|\| !date \|\| !time \|\| !service\) {[\s\S]*?return res.status\(400\).json\(\{ error: 'Faltan campos requeridos' \}\);[\s\S]*?}/,
  `const { name, email, date, time, service, paidInAdvance } = req.body;
    
    if (!name || !email || !date || !time || !service) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const blockedSlots = await getStore('blockedSlots');
    const bookings = await getStore('bookings');`
);

newContent = newContent.replace(
  "bookings.push(booking);",
  "bookings.push(booking);\n    await setStore('bookings', bookings);"
);

// inside app.patch('/api/bookings/:id')
newContent = newContent.replace(
  "app.patch('/api/bookings/:id', async (req, res) => {\n    const { id } = req.params;\n    const { status } = req.body;\n    \n    const booking = bookings.find(b => b.id === id);",
  "app.patch('/api/bookings/:id', async (req, res) => {\n    const { id } = req.params;\n    const { status } = req.body;\n    \n    const bookings = await getStore('bookings');\n    const booking = bookings.find(b => b.id === id);"
);

newContent = newContent.replace(
  "booking.status = status;",
  "booking.status = status;\n      await setStore('bookings', bookings);"
);

fs.writeFileSync('server.ts', newContent);
