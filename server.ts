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
    const { name, email, date, time, service, paidInAdvance } = req.body;
    
    if (!name || !email || !date || !time || !service) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Check if slot is taken
    const exists = bookings.find(b => b.date === date && b.time === time);
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
      status: 'confirmed' 
    };
    bookings.push(booking);

    const paymentText = paidInAdvance 
      ? '<p style="color: #666; font-size: 12px; line-height: 1.5; text-align: center; border-top: 1px solid #222; padding-top: 20px;">Has indicado que enviaste el pago adelantado por Bizum. Lo revisaremos pronto.</p>'
      : '<p style="color: #666; font-size: 12px; line-height: 1.5; text-align: center; border-top: 1px solid #222; padding-top: 20px;">Recuerda abonar el importe el día de tu cita en el estudio.</p>';

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Andrea Nails Studio <onboarding@resend.dev>', // Importante: Verifica tu dominio en Resend para usar un email personalizado
          to: email,
          subject: 'Confirmación de Reserva | Andrea Nails Studio',
          html: `
            <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; padding: 40px; border-radius: 4px; border: 1px solid #222;">
              
              <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://nube.marcogugliandolo.com/s/FZWwcYLoqfJerq5/download" alt="Andrea Nails Studio" style="width: 150px; height: auto;" />
              </div>

              <h1 style="color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: -0.5px; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #222; padding-bottom: 20px;">
                Nos vemos pronto.
              </h1>
              
              <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                Hola <strong>${name}</strong>,<br/>
                Tu cita ha sido reservada y confirmada con éxito. Aquí tienes los detalles:
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
                Andrea Nails Studio<br/>
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
