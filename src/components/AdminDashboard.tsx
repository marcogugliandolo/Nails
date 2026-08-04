import React, { useEffect, useState } from 'react';
import { LogOut, Calendar, Clock, User, CreditCard, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Booking {
  id: string;
  name: string;
  email: string;
  date: string;
  time: string;
  service: string;
  paidInAdvance: boolean;
  status: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = () => {
    setIsLoading(true);
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        // Sort bookings by date and time
        const sorted = data.sort((a: Booking, b: Booking) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.time.localeCompare(b.time);
        });
        setBookings(sorted);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchBookings();
      } else {
        console.error('Failed to update booking status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen w-full bg-[#050505] text-white p-6 lg:p-12"
    >
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-white/10 pb-8 gap-6">
          <div>
            <h1 className="font-display text-4xl uppercase tracking-tighter mb-2">Panel de Control</h1>
            <p className="text-sm opacity-50 uppercase tracking-widest">Gestión de Reservas</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm uppercase tracking-widest border border-white/20 px-6 py-3 hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 opacity-50">
            Cargando reservas...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 border border-white/10 bg-[#0a0a0a]">
            <p className="text-xl font-display uppercase opacity-50">No hay reservas registradas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="border border-white/10 bg-white/5 p-6 hover:border-white/30 transition-colors">
                <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-white/10">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 block mb-1">Fecha</span>
                      <p className="font-display text-lg uppercase">
                        {format(parseISO(booking.date), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 block mb-1">Hora</span>
                      <p className="font-display text-lg uppercase">{booking.time}</p>
                    </div>
                    <div className="w-10 h-10 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-white/10">
                      <Clock size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <User size={16} className="opacity-50 mt-1" />
                    <div>
                      <p className="font-display uppercase text-lg">{booking.name}</p>
                      <p className="text-sm opacity-50">{booking.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-white/20"></div>
                    <p className="font-display uppercase">{booking.service}</p>
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-white/5 mt-4">
                    <CreditCard size={16} className="opacity-50" />
                    <p className={`text-xs uppercase tracking-widest ${booking.paidInAdvance ? 'text-green-400' : 'text-white/50'}`}>
                      {booking.paidInAdvance ? 'Adelanto Pagado (Bizum)' : 'Pago Pendiente en Estudio'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                    <div className={`px-3 py-1 rounded text-[10px] uppercase tracking-widest border
                      ${booking.status === 'confirmed' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 
                        booking.status === 'rejected' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 
                        'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
                      {booking.status === 'confirmed' ? 'Aceptada' : booking.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                    </div>

                    <div className="flex gap-2">
                      {booking.status !== 'confirmed' && (
                        <button 
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          className="flex items-center gap-1 bg-white text-black px-3 py-1.5 text-xs font-semibold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                        >
                          <Check size={14} /> Aceptar
                        </button>
                      )}
                      {booking.status !== 'rejected' && (
                        <button 
                          onClick={() => handleStatusChange(booking.id, 'rejected')}
                          className="flex items-center gap-1 border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest hover:bg-white/10 transition-colors"
                        >
                          <X size={14} /> Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
