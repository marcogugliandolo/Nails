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
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reservas' | 'servicios' | 'tienda' | 'disponibilidad'>('reservas');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, itemIndex: number, type: 'service' | 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (type === 'service') {
        const newServices = [...services];
        newServices[itemIndex].img = base64String;
        setServices(newServices);
      } else {
        const newProducts = [...products];
        newProducts[itemIndex].img = base64String;
        setProducts(newProducts);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, sRes, pRes, blRes] = await Promise.all([
        fetch('/api/bookings', { cache: 'no-store' }),
        fetch('/api/services', { cache: 'no-store' }),
        fetch('/api/products', { cache: 'no-store' }),
        fetch('/api/blocked-slots', { cache: 'no-store' })
      ]);

      if (bRes.ok) {
        const data = await bRes.json();
        const sorted = data.sort((a: Booking, b: Booking) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.time.localeCompare(b.time);
        });
        setBookings(sorted);
      }
      if (sRes.ok) setServices(await sRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (blRes.ok) setBlockedSlots(await blRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getServicePrice = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    return service ? service.price : '';
  };

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
        fetchData();
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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-8 gap-6">
          <div>
            <h1 className="font-display text-4xl uppercase tracking-tighter mb-2">Panel de Control</h1>
            <p className="text-sm opacity-50 uppercase tracking-widest">Gestión del Estudio</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm uppercase tracking-widest border border-white/20 px-6 py-3 hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </header>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-4 hide-scrollbar">
          {(['reservas', 'servicios', 'tienda', 'disponibilidad'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-xs uppercase tracking-[0.2em] transition-all border
                ${activeTab === tab ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-white/50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 opacity-50">
            Cargando datos...
          </div>
        ) : activeTab === 'reservas' ? (
          bookings.length === 0 ? (
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
                    <p className="font-display uppercase">{booking.service} <span className="opacity-50 ml-2">({getServicePrice(booking.service)})</span></p>
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
          )
        ) : activeTab === 'servicios' ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={() => {
                  const newService = { id: Date.now().toString(), name: 'Nuevo Servicio', duration: '30 MIN', price: '0€', img: '' };
                  const newServices = [...services, newService];
                  setServices(newServices);
                  fetch('/api/services', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ services: newServices })
                  });
                }}
                className="bg-white text-black px-6 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-white/90 transition-colors"
              >
                Añadir Servicio
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <div key={service.id} className="border border-white/10 bg-white/5 p-6 flex flex-col gap-4 relative">
                  <button 
                    onClick={() => {
                      const newServices = services.filter((_, i) => i !== index);
                      setServices(newServices);
                      fetch('/api/services', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ services: newServices })
                      });
                    }}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar servicio"
                  >
                    <X size={20} />
                  </button>
                  {service.img && (
                    <div className="h-32 w-full overflow-hidden mb-2 bg-[#050505] border border-white/10">
                      <img src={service.img} alt={service.name} className="w-full h-full object-cover opacity-70 grayscale-[100%] contrast-125" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <input 
                    type="text" 
                    value={service.name} 
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].name = e.target.value;
                      setServices(newServices);
                    }}
                    className="bg-transparent border-b border-white/20 pb-2 text-xl font-display outline-none focus:border-white pr-8" 
                  />
                  <input 
                    type="text" 
                    value={service.price} 
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].price = e.target.value;
                      setServices(newServices);
                    }}
                    className="bg-transparent border-b border-white/20 pb-2 outline-none focus:border-white" 
                    placeholder="Precio (ej. 15€)"
                  />
                  <input 
                    type="text" 
                    value={service.duration} 
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].duration = e.target.value;
                      setServices(newServices);
                    }}
                    className="bg-transparent border-b border-white/20 pb-2 outline-none focus:border-white" 
                    placeholder="Duración (ej. 45 MIN)"
                  />
                  <input 
                    type="text" 
                    value={service.img} 
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].img = e.target.value;
                      setServices(newServices);
                    }}
                    className="bg-transparent border-b border-white/20 pb-2 outline-none focus:border-white text-xs opacity-50" 
                    placeholder="URL de Imagen o sube un archivo"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, index, 'service')}
                    className="text-xs opacity-50"
                  />
                  <button 
                    onClick={() => {
                      fetch('/api/services', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ services })
                      });
                      alert('Servicio actualizado');
                    }}
                    className="mt-2 bg-white text-black px-4 py-2 text-xs uppercase tracking-widest font-semibold"
                  >
                    Guardar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'tienda' ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={() => {
                  const newProduct = { id: Date.now().toString(), name: 'Nuevo Producto', price: '0€', img: '' };
                  const newProducts = [...products, newProduct];
                  setProducts(newProducts);
                  fetch('/api/products', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ products: newProducts })
                  });
                }}
                className="bg-white text-black px-6 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-white/90 transition-colors"
              >
                Añadir Producto
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product, index) => (
                <div key={product.id} className="border border-white/10 bg-white/5 p-6 flex flex-col gap-4 relative">
                  <button 
                    onClick={() => {
                      const newProducts = products.filter((_, i) => i !== index);
                      setProducts(newProducts);
                      fetch('/api/products', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ products: newProducts })
                      });
                    }}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar producto"
                  >
                    <X size={20} />
                  </button>
                  {product.img && (
                    <div className="h-32 w-full overflow-hidden mb-2 bg-[#050505] border border-white/10">
                      <img src={product.img} alt={product.name} className="w-full h-full object-cover opacity-70 grayscale-[100%] contrast-125" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <input 
                    type="text" 
                    value={product.name} 
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index].name = e.target.value;
                      setProducts(newProducts);
                    }}
                    className="bg-transparent border-b border-white/20 pb-2 text-xl font-display outline-none focus:border-white pr-8" 
                  />
                  <input 
                    type="text" 
                    value={product.price} 
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index].price = e.target.value;
                      setProducts(newProducts);
                    }}
                    className="bg-transparent border-b border-white/20 pb-2 outline-none focus:border-white" 
                    placeholder="Precio"
                  />
                  <input 
                    type="text" 
                    value={product.img} 
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index].img = e.target.value;
                      setProducts(newProducts);
                    }}
                    className="bg-transparent border-b border-white/20 pb-2 outline-none focus:border-white text-xs opacity-50" 
                    placeholder="URL de Imagen o sube un archivo"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, index, 'product')}
                    className="text-xs opacity-50"
                  />
                  <button 
                    onClick={() => {
                      fetch('/api/products', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ products })
                      });
                      alert('Producto actualizado');
                    }}
                    className="mt-2 bg-white text-black px-4 py-2 text-xs uppercase tracking-widest font-semibold"
                  >
                    Guardar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="border border-white/10 bg-white/5 p-6 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs uppercase tracking-widest opacity-50 mb-2">Fecha a bloquear</label>
                <input 
                  type="date" 
                  id="block-date"
                  className="w-full bg-transparent border-b border-white/20 pb-2 outline-none focus:border-white [color-scheme:dark]" 
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs uppercase tracking-widest opacity-50 mb-2">Hora (dejar en blanco para todo el día)</label>
                <select id="block-time" className="w-full bg-[#050505] border-b border-white/20 pb-2 outline-none focus:border-white">
                  <option value="all">Todo el día</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                  <option value="18:00">18:00</option>
                </select>
              </div>
              <button 
                onClick={async () => {
                  const date = (document.getElementById('block-date') as HTMLInputElement).value;
                  const time = (document.getElementById('block-time') as HTMLSelectElement).value;
                  if (!date) return alert('Selecciona una fecha');
                  const res = await fetch('/api/blocked-slots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date, time })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setBlockedSlots([...blockedSlots, data.blockedSlot]);
                  }
                }}
                className="bg-white text-black px-6 py-2 text-xs uppercase tracking-widest font-semibold w-full sm:w-auto"
              >
                Bloquear
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-display text-2xl uppercase tracking-tighter mb-4">Fechas Bloqueadas</h3>
              {blockedSlots.length === 0 ? (
                <p className="opacity-50 text-sm">No hay fechas bloqueadas.</p>
              ) : (
                blockedSlots.map(slot => (
                  <div key={slot.id} className="flex justify-between items-center border border-white/10 p-4">
                    <div>
                      <span className="font-display text-lg block">{slot.date}</span>
                      <span className="text-xs uppercase tracking-widest opacity-50">
                        {slot.time === 'all' ? 'Todo el día' : `Hora: ${slot.time}`}
                      </span>
                    </div>
                    <button 
                      onClick={async () => {
                        const res = await fetch(`/api/blocked-slots/${slot.id}`, { method: 'DELETE' });
                        if (res.ok) setBlockedSlots(blockedSlots.filter(s => s.id !== slot.id));
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors border border-red-500/30 px-3 py-1 text-xs uppercase tracking-widest"
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
