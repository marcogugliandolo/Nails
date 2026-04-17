import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

// Simple in-memory store for prototype
const bookings: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API constraints: available slots from 9:00 to 18:00
  // In a real app we'd check times, duration, etc.

  app.get('/api/bookings', (req, res) => {
    res.json(bookings);
  });

  app.post('/api/bookings', async (req, res) => {
    const { name, email, date, time, service } = req.body;
    
    if (!name || !email || !date || !time || !service) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Check if slot is taken
    const exists = bookings.find(b => b.date === date && b.time === time);
    if (exists) {
      return res.status(400).json({ error: 'La cita ya no está disponible' });
    }

    const booking = { id: Date.now().toString(), name, email, date, time, service, status: 'confirmed' };
    bookings.push(booking);

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Citas Uñas <onboarding@resend.dev>', // In a real app verify your domain in Resend
          to: email,
          subject: 'Confirmación de tu reserva - Uñas',
          html: `<div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #5A5A40;">¡Hola ${name}!</h2>
            <p>Tu cita se ha confirmado correctamente.</p>
            <ul>
              <li><strong>Servicio:</strong> ${service}</li>
              <li><strong>Fecha:</strong> ${date}</li>
              <li><strong>Hora:</strong> ${time}</li>
            </ul>
            <p>¡Te esperamos!</p>
          </div>`
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
