import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase() === 'andrea' && password === 'lumaira2026') {
      onLogin();
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center p-6"
    >
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#0a0a0a] border border-white/20 text-white rounded-full flex items-center justify-center mb-6">
            <Lock size={28} strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-4xl uppercase tracking-tighter mb-2">Administración</h2>
          <p className="text-sm opacity-50 uppercase tracking-widest">Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block mb-2">Usuario</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 pb-4 text-xl font-display outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="relative">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block mb-2">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 pb-4 text-xl font-display outline-none focus:border-white transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            className="w-full mt-8 bg-white text-black py-6 font-display text-xl uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            Entrar
          </button>
        </form>
      </div>
    </motion.div>
  );
}
