import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  isSameDay, 
  startOfToday, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isBefore,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Facebook, Instagram } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock UI Services with high visual impact images
const SERVICES = [
  { id: 'manicura', name: 'Manicura Clásica', duration: '45 MIN', price: '15€', img: 'https://upload.wikimedia.org/wikipedia/commons/8/88/French_manicure_with_silver_nail_polish.jpg' },
  { id: 'pedicura', name: 'Pedicura Spa', duration: '60 MIN', price: '25€', img: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Pink_nails_and_glitter_manicure.jpg' },
  { id: 'acrilicas', name: 'Uñas Acrílicas', duration: '90 MIN', price: '35€', img: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Acrylic_nail_art_with_crystal.jpg' },
  { id: 'nailart', name: 'Nail Art', duration: '120 MIN', price: '45€', img: 'https://upload.wikimedia.org/wikipedia/commons/3/36/UV_manicure_lamps_%2815157277325%29.jpg' },
];

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

interface Booking {
  id: string;
  date: string;
  time: string;
  service: string;
  name: string;
  email: string;
}

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upcomingDays = Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i));

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error('Error fetching bookings:', e);
    }
  };

  const bookedSlotsForDate = bookings
    .filter(b => b.date === format(selectedDate, 'yyyy-MM-dd'))
    .map(b => b.time);

  const isDayFullyBooked = (date: Date) => {
    const bookedForDay = bookings.filter(b => b.date === format(date, 'yyyy-MM-dd')).length;
    return bookedForDay >= TIME_SLOTS.length;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !formData.name || !formData.email) return;

    setIsSubmitting(true);
    const serviceName = SERVICES.find(s => s.id === selectedService)?.name || selectedService;

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        service: serviceName
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchBookings();
        setStep(4);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Hubo un problema al realizar la reserva.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine imagery for left pane
  const currentServiceObj = SERVICES.find(s => s.id === selectedService);
  const heroImage = currentServiceObj?.img || SERVICES.find(s => s.id === 'nailart')?.img || '';

  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll right pane to top on step change
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // For mobile fallback
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const resetFlow = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedTime(null);
    setFormData({ name: '', email: '', phone: '' });
    setSelectedDate(startOfToday());
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans">
      
      {/* Left split screen - Sticky Hero Image */}
      <div className="w-full lg:w-1/2 h-[35vh] lg:h-screen relative flex flex-col justify-between p-6 lg:p-12 overflow-hidden shrink-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={heroImage}
            src={heroImage}
            referrerPolicy="no-referrer"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover grayscale-[100%] saturate-0 contrast-125 opacity-50"
          />
        </AnimatePresence>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent lg:bg-gradient-to-r lg:from-[#050505]/20 lg:to-[#050505]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full lg:flex-row lg:justify-between lg:items-start lg:w-auto">
          <div className="flex flex-col items-center justify-start p-2 select-none group">
            <img 
              src="https://nube.marcogugliandolo.com/s/FZWwcYLoqfJerq5/download" 
              alt="Andrea Nails Studio" 
              className="block w-64 lg:w-[480px] h-auto [filter:drop-shadow(0_0_20px_rgba(255,255,255,0.2))] mix-blend-screen brightness-115 contrast-110 transition-transform duration-700 hover:scale-105"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-6 hidden lg:block">Reserva</span>
        </div>

        <div className="relative z-10 hidden lg:block">
          <p className="text-sm uppercase tracking-[0.2em] opacity-50 mb-4 max-w-sm">
            Un espacio diseñado para tu bienestar y el cuidado artesanal.
          </p>
          <div className="font-display text-7xl uppercase tracking-tighter leading-[0.8] mb-4">
            {step === 1 ? 'Elige tu servicio.' : 
             step === 2 ? 'Fecha y hora.' : 
             step === 3 ? 'Tus datos.' : 
             'Todo listo.'}
          </div>
        </div>
      </div>

      {/* Right split screen - Flow Content */}
      <div ref={scrollRef} className="w-full lg:w-1/2 lg:h-screen lg:overflow-y-auto flex flex-col relative bg-[#050505] scroll-smooth">
        
        {/* Back Button */}
        <div className="sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-xl px-6 lg:px-16 lg:pt-16 py-6 flex items-center min-h-[80px]">
          {step > 1 && step < 4 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft size={16} /> Volver
            </button>
          )}
          {step === 1 && (
            <span className="text-sm uppercase tracking-widest opacity-40">Paso 01/03</span>
          )}
        </div>

        <div className="px-6 lg:px-16 pb-24 lg:pb-32 flex-grow flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: SERVICES */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-xl mx-auto lg:mx-0"
              >
                <h2 className="font-display text-4xl lg:text-5xl uppercase tracking-tighter mb-10 lg:hidden">
                  Elige tu servicio.
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {SERVICES.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service.id);
                        setStep(2);
                      }}
                      className="group relative aspect-[3/4] overflow-hidden bg-[#050505] border border-white/10 hover:border-white/40 transition-all duration-500 clip-image text-left"
                    >
                      {/* High contrast, stark grayscale filters for true minimalist B&W moody aesthetic */}
                      <img 
                        src={service.img} 
                        referrerPolicy="no-referrer" 
                        className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-60 group-hover:opacity-100 transition-opacity duration-700 grayscale-[100%] saturate-0 contrast-125" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90" />
                      <div className="absolute bottom-0 left-0 p-5">
                        <h3 className="font-display text-xl uppercase tracking-tight mb-1">{service.name}</h3>
                        <p className="text-[10px] opacity-60 tracking-[0.2em] uppercase">{service.price} &bull; {service.duration}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-xl mx-auto lg:mx-0"
              >
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-display text-2xl uppercase tracking-tighter">Fecha</h2>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        disabled={isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(startOfToday()))}
                      >
                        <ChevronLeft className="w-5 h-5 opacity-60" />
                      </button>
                      <span className="font-display text-lg uppercase min-w-[120px] text-center">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                      </span>
                      <button 
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 opacity-60" />
                      </button>
                    </div>
                  </div>

                  {/* Monthly Grid */}
                  <div className="grid grid-cols-7 mb-2 border-b border-white/10 pb-2">
                    {['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'].map(d => (
                      <span key={d} className="text-[10px] text-center opacity-40 font-bold tracking-widest">{d}</span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const monthStart = startOfMonth(currentMonth);
                      const monthEnd = endOfMonth(monthStart);
                      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                      const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                      return calendarDays.map((day, idx) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isPast = isBefore(day, startOfDay(startOfToday()));
                        const isFull = isDayFullyBooked(day);
                        const isTodayDate = isToday(day);

                        return (
                          <button
                            key={idx}
                            disabled={!isCurrentMonth || isPast || isFull}
                            onClick={() => {
                              setSelectedDate(day);
                              setSelectedTime(null);
                            }}
                            className={`aspect-square p-2 transition-all flex flex-col items-center justify-center border relative ${
                              !isCurrentMonth ? 'opacity-0 pointer-events-none' :
                              isPast || isFull
                                ? 'opacity-20 border-white/5 cursor-not-allowed grayscale'
                                : isSelected 
                                ? 'bg-white text-black border-white z-10 scale-[1.05] shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                                : 'bg-[#0a0a0a] border-white/10 text-white hover:border-white/40'
                            }`}
                          >
                            <span className={`font-display text-lg ${isSelected ? 'font-bold' : ''}`}>
                              {format(day, 'd')}
                            </span>
                            {isTodayDate && !isSelected && (
                              <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full" />
                            )}
                            {isFull && isCurrentMonth && !isPast && (
                              <div className="absolute bottom-1 w-4 h-[1px] bg-[#ff4a4a]" />
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-end border-b border-white/20 pb-4 mb-8">
                    <h2 className="font-display text-2xl uppercase tracking-tighter">Hora</h2>
                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-40">
                      {format(selectedDate, 'EEEE d \'de\' MMMM', { locale: es })}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {TIME_SLOTS.map((time) => {
                      const isBooked = bookedSlotsForDate.includes(time);
                      const isSelected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          disabled={isBooked}
                          onClick={() => setSelectedTime(time)}
                          className={`py-4 text-center font-display text-base transition-all border ${
                            isBooked
                              ? 'line-through opacity-20 border-white/5 cursor-not-allowed'
                              : isSelected
                              ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                              : 'bg-transparent border-white/10 hover:border-white'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="w-1/3 py-6 border border-white/20 font-display text-sm uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Volver
                  </button>
                  <button
                    disabled={!selectedTime}
                    onClick={() => setStep(3)}
                    className="w-2/3 bg-white text-black py-6 font-display text-xl uppercase tracking-widest hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Continuar
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DETAILS & CONFIRM */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-xl mx-auto lg:mx-0"
              >
                <div className="mb-12 border-l-2 border-white/40 pl-6 pb-2">
                  <h3 className="font-display text-2xl uppercase mb-1">{currentServiceObj?.name}</h3>
                  <p className="text-xs tracking-[0.2em] uppercase opacity-60">
                    {format(selectedDate, 'dd MMM', { locale: es })} a las {selectedTime}
                  </p>
                </div>

                <form id="booking-form" onSubmit={handleBooking} className="space-y-10">
                  <div className="relative">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Tu nombre completo"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="modern-input w-full"
                    />
                  </div>

                  <div className="relative">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      placeholder="hola@ejemplo.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="modern-input w-full"
                    />
                  </div>

                  <div className="relative">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block">Número de Whatsapp</label>
                    <input
                      type="tel"
                      required
                      placeholder="+34 600 000 000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="modern-input w-full"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-12 bg-white text-black py-6 font-display text-xl uppercase tracking-widest hover:bg-gray-200 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-all flex justify-center items-center gap-3"
                  >
                    {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl mx-auto lg:mx-0 flex flex-col items-start"
              >
                <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mb-8">
                  <CheckCircle2 size={32} />
                </div>
                <h1 className="font-display text-5xl lg:text-7xl uppercase tracking-tighter leading-none mb-6">
                  Nos<br/>vemos<br/>pronto.
                </h1>
                <div className="border-t border-white/20 pt-6 mt-4 w-full">
                  <p className="text-sm md:text-base leading-relaxed opacity-70 mb-10 max-w-md">
                    Tu cita ha sido confirmada con éxito. Hemos enviado un correo detallado a <strong className="text-white">{formData.email}</strong>.
                  </p>
                  <button 
                    onClick={resetFlow}
                    className="px-8 py-4 border border-white hover:bg-white hover:text-black transition-all text-sm uppercase tracking-widest"
                  >
                    Nueva Reserva
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer / Socials */}
        <div className="mt-auto px-6 py-10 lg:px-16 lg:pb-12 flex flex-col items-center justify-center gap-6 opacity-60">
          <div className="w-8 h-[1px] bg-white/20"></div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors duration-300 hover:scale-110 transform" aria-label="Instagram">
              <Instagram size={20} strokeWidth={1.5} />
            </a>
            <a href="#" className="hover:text-white transition-colors duration-300 hover:scale-110 transform" aria-label="Facebook">
              <Facebook size={20} strokeWidth={1.5} />
            </a>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">
            © {new Date().getFullYear()} Andrea Nails Studio
          </p>
        </div>
      </div>
    </div>
  );
}
