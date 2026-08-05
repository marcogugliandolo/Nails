import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

// Simple in-memory store for prototype
import Database from 'better-sqlite3';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.sqlite');

function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let db;
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
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS store (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

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

async function startServer() {
  const db = initDB();
  
  const getStore = (key) => {
    const row = db.prepare('SELECT value FROM store WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : [];
  };
  
  const setStore = (key, value) => {
    db.prepare('UPDATE store SET value = ? WHERE key = ?').run(JSON.stringify(value), key);
  };

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API constraints: available slots from 9:00 to 18:00
  // In a real app we'd check times, duration, etc.

  app.get('/api/services', async (req, res) => res.json(getStore('services')));
  app.put('/api/services', async (req, res) => {
    const services = req.body.services;
    setStore('services', services);
    res.json({ success: true, services });
  });

  app.get('/api/products', async (req, res) => res.json(getStore('products')));
  app.put('/api/products', async (req, res) => {
    const products = req.body.products;
    setStore('products', products);
    res.json({ success: true, products });
  });

  app.get('/api/blocked-slots', async (req, res) => res.json(getStore('blockedSlots')));
  app.post('/api/blocked-slots', async (req, res) => {
    const { date, time } = req.body;
    const newBlocked = { id: Date.now().toString(), date, time };
    const blockedSlots = getStore('blockedSlots');
    blockedSlots.push(newBlocked);
    setStore('blockedSlots', blockedSlots);
    res.json({ success: true, blockedSlot: newBlocked });
  });
  app.delete('/api/blocked-slots/:id', async (req, res) => {
    let blockedSlots = getStore('blockedSlots');
    blockedSlots = blockedSlots.filter(s => s.id !== req.params.id);
    setStore('blockedSlots', blockedSlots);
    res.json({ success: true });
  });

  app.get('/api/bookings', async (req, res) => {
    res.json(getStore('bookings'));
  });

  app.post('/api/bookings', async (req, res) => {
    const { name, email, date, time, service, paidInAdvance } = req.body;
    
    if (!name || !email || !date || !time || !service) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const blockedSlots = getStore('blockedSlots');
    const bookings = getStore('bookings');

    // Check if slot is taken or blocked
    const isBlocked = blockedSlots.find(b => b.date === date && (b.time === 'all' || b.time === time));
    if (isBlocked) {
      return res.status(400).json({ error: 'Este horario no está disponible por el momento' });
    }

    const exists = bookings.find(b => b.date === date && b.time === time && b.status !== 'rejected');
    if (exists) {
      return res.status(400).json({ error: 'La cita ya no está disponible' });
    }

    const booking = { 
      id: Date.now().toString(), 
      name, 
      email, 
      date, 
      time, 
      service, 
      paidInAdvance: !!paidInAdvance, 
      status: 'pending' 
    };
    bookings.push(booking);
    setStore('bookings', bookings);

    const paymentText = paidInAdvance 
      ? '<p style="color: #666; font-size: 12px; line-height: 1.5; text-align: center; border-top: 1px solid #222; padding-top: 20px;">Has indicado que enviaste el pago adelantado por Bizum. Lo revisaremos pronto.</p>'
      : '<p style="color: #666; font-size: 12px; line-height: 1.5; text-align: center; border-top: 1px solid #222; padding-top: 20px;">Recuerda abonar el importe el día de tu cita en el estudio.</p>';

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Lumaira Nails Studio <onboarding@resend.dev>', // Importante: Verifica tu dominio en Resend para usar un email personalizado
          to: email,
          subject: 'Confirmación de Reserva | Lumaira Nails Studio',
          html: `
            <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; padding: 40px; border-radius: 4px; border: 1px solid #222;">
              
              <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://ais-dev-vj3nkapixkqp6pii34qpuq-385930783825.europe-west2.run.app/icon.png" alt="Lumaira Nails Studio" style="width: 150px; height: auto;" />
              </div>

              <h1 style="color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: -0.5px; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #222; padding-bottom: 20px;">
                Nos vemos pronto.
              </h1>
              
              <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                Hola <strong>${name}</strong>,<br/>
                Tu cita ha sido recibida y está pendiente de confirmación. Aquí tienes los detalles:
              </p>

              <div style="background-color: #0a0a0a; padding: 25px; border-left: 2px solid #ffffff; margin-bottom: 30px;">
                <p style="margin: 0 0 15px 0;">
                  <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px;">Servicio</span>
                  <strong style="font-size: 18px; font-weight: 400; letter-spacing: -0.5px;">${service}</strong>
                </p>
                
                <p style="margin: 0 0 15px 0;">
                  <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px;">Fecha</span>
                  <strong style="font-size: 16px; font-weight: 400;">${date}</strong>
                </p>

                <p style="margin: 0;">
                  <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px;">Hora</span>
                  <strong style="font-size: 16px; font-weight: 400;">${time}</strong>
                </p>
              </div>

              ${paymentText}

              <p style="color: #666; font-size: 12px; line-height: 1.5; text-align: center; border-top: 1px solid #222; padding-top: 20px;">
                <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5;">Ubicación</span>
                Lumaira Nails Studio<br/>
                Si necesitas cancelar o modificar tu cita, por favor contáctanos con 24h de antelación.
              </p>
            </div>
          `
        });
        console.log('Email enviado correctamente a', email);
      } catch (error) {
        console.error('Error enviando email:', error);
      }
    } else {
      console.log('No ENV RESEND_API_KEY. Simulating email send to:', email);
    }

    res.json({ success: true, booking });
  });

  app.patch('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const bookings = getStore('bookings');
    const booking = bookings.find(b => b.id === id);
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (status && ['pending', 'confirmed', 'rejected'].includes(status)) {
      booking.status = status;
      setStore('bookings', bookings);
      
      // Send email about status change
      if (process.env.RESEND_API_KEY && (status === 'confirmed' || status === 'rejected')) {
        try {
          const statusText = status === 'confirmed' ? 'confirmada' : 'rechazada';
          const messageText = status === 'confirmed' 
            ? '¡Buenas noticias! Tu cita ha sido confirmada.' 
            : 'Lo sentimos, no hemos podido aceptar tu reserva en este momento. Por favor, contáctanos para buscar otra alternativa.';
            
          await resend.emails.send({
            from: 'Lumaira Nails Studio <onboarding@resend.dev>', // Importante: Verifica tu dominio en Resend para usar un email personalizado
            to: booking.email,
            subject: `Tu reserva ha sido ${statusText} | Lumaira Nails Studio`,
            html: `
              <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; padding: 40px; border-radius: 4px; border: 1px solid #222;">
                <div style="text-align: center; margin-bottom: 40px;">
                  <img src="https://ais-dev-vj3nkapixkqp6pii34qpuq-385930783825.europe-west2.run.app/icon.png" alt="Lumaira Nails Studio" style="width: 150px; height: auto;" />
                </div>
  
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: -0.5px; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #222; padding-bottom: 20px;">
                  Actualización de tu cita
                </h1>
                
                <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                  Hola <strong>${booking.name}</strong>,<br/>
                  ${messageText}
                </p>
  
                <div style="background-color: #0a0a0a; padding: 25px; border-left: 2px solid ${status === 'confirmed' ? '#4ade80' : '#f87171'}; margin-bottom: 30px;">
                  <p style="margin: 0 0 15px 0;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px;">Servicio</span>
                    <strong style="font-size: 16px; font-weight: 400;">${booking.service}</strong>
                  </p>
                  
                  <p style="margin: 0 0 15px 0;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px;">Fecha</span>
                    <strong style="font-size: 16px; font-weight: 400;">${booking.date}</strong>
                  </p>
  
                  <p style="margin: 0;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px;">Hora</span>
                    <strong style="font-size: 16px; font-weight: 400;">${booking.time}</strong>
                  </p>
                </div>
  
                <p style="color: #666; font-size: 12px; line-height: 1.5; text-align: center; border-top: 1px solid #222; padding-top: 20px;">
                  <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5;">Ubicación</span>
                  Lumaira Nails Studio<br/>
                  Si necesitas cancelar o modificar tu cita, por favor contáctanos con 24h de antelación.
                </p>
              </div>
            `
          });
          console.log('Email de estado enviado correctamente a', booking.email);
        } catch (error) {
          console.error('Error enviando email de estado:', error);
        }
      }
    }
    
    res.json({ success: true, booking });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
