import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
  };

  const handleQuickFill = (mockEmail, mockPass) => {
    setEmail(mockEmail);
    setPassword(mockPass);
  };

  return (
    <Modal
      isOpen={isLoginModalOpen}
      onClose={() => setIsLoginModalOpen(false)}
      title="Acceso de Personal Autorizado"
      subtitle="Ingrese sus credenciales corporativas para ingresar al panel interno"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Aviso de integración pendiente */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-normal">
          <i className="fa-solid fa-triangle-exclamation mr-1 text-amber-600"></i>
          <strong>Integración pendiente:</strong> El servidor aún no dispone de endpoint oficial de autenticación. Para evaluación de los tres paneles de la UI, puede utilizar los accesos de prueba a continuación.
        </div>

        <div>
          <label className="block text-xs font-black text-gray-700 uppercase mb-1">
            Correo Electrónico
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <i className="fa-solid fa-envelope text-sm"></i>
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@tallerbautista.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-bautista-red focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-700 uppercase mb-1">
            Contraseña
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <i className="fa-solid fa-lock text-sm"></i>
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-bautista-red focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Acceso rápido para pruebas de roles */}
        <div className="pt-2">
          <span className="text-[10px] font-black uppercase text-gray-400 block mb-2">
            Cuentas de demostración de roles:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('ali@gmail.com', '12345')}
              className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold truncate transition-colors text-center"
            >
              Secretaría
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('nacho@gmail.com', '12345')}
              className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold truncate transition-colors text-center"
            >
              Jefe Taller
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('josue@gmail.com', '12345')}
              className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold truncate transition-colors text-center"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-bautista-red hover:bg-bautista-darkRed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-to-bracket"></i>
            <span>{isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
