import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { CONTACTS_CONFIG } from '../../config/contacts';
import { formatDateLongEs } from '../../utils/dateUtils';
import {
  formatPhone,
  validateName,
  validatePhone,
  validateEmail,
  buildWhatsAppLink,
} from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function WhatsAppModal({ isOpen, onClose, dateStr, slot }) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Generar mensaje inicial al abrir
  useEffect(() => {
    if (isOpen && dateStr && slot) {
      const friendlyDate = formatDateLongEs(dateStr);
      setMessage(
        `Hola Taller Bautista, me gustaría reservar un espacio para mi vehículo el día ${friendlyDate} en el horario de ${slot}. ¿Tienen disponibilidad?`
      );
    }
  }, [isOpen, dateStr, slot]);

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSend = (withPersonalData = true) => {
    let finalMessage = message;

    if (withPersonalData) {
      if (!validateName(name)) {
        showToast(
          "El nombre es obligatorio y solo debe contener letras y espacios.",
          "error"
        );
        return;
      }
      if (!validatePhone(phone)) {
        showToast(
          "El teléfono es obligatorio y debe tener al menos 8 dígitos.",
          "error"
        );
        return;
      }
      if (email.trim() && !validateEmail(email)) {
        showToast("El correo electrónico ingresado no tiene un formato válido.", "error");
        return;
      }

      const emailStr = email.trim() || 'No ingresado';

      // Formato estructurado y natural sin emojis extraños
      finalMessage = `*¡Hola equipo de Taller Bautista!*\n\nLes comparto mis datos para agilizar mi solicitud de reserva:\n• *Nombre:* ${name.trim()}\n• *Teléfono:* ${phone.trim()}\n• *Correo:* ${emailStr}\n\n*Detalles de mi solicitud:*\n"${message.trim()}"\n\n¡Muchas gracias y quedo a la espera de su confirmación!`;
    }

    const waLink = buildWhatsAppLink(CONTACTS_CONFIG.whatsAppNumber, finalMessage);

    // Abrir WhatsApp en pestaña nueva
    window.open(waLink, '_blank', 'noopener,noreferrer');
    showToast("Redirigiendo a WhatsApp...", "success");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitud de Reserva vía WhatsApp"
      subtitle="Complete sus datos de contacto para preparar su mensaje oficial"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Resumen del turno */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between text-xs sm:text-sm">
          <div>
            <span className="text-gray-400 font-bold block uppercase text-[10px]">Fecha</span>
            <span className="font-black text-gray-900">{formatDateLongEs(dateStr)}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 font-bold block uppercase text-[10px]">Horario</span>
            <span className="font-black text-bautista-red">{slot}</span>
          </div>
        </div>

        {/* Formulario de datos */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Roberto Henríquez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-bautista-red focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                Teléfono de contacto <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="7000-0000"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={9}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-bautista-red focus:border-transparent outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                Correo Electrónico <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-bautista-red focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase mb-1">
              Mensaje Personalizable
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-bautista-red focus:border-transparent outline-none resize-none"
            ></textarea>
          </div>
        </div>

        {/* Aviso de confirmación */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
          <i className="fa-solid fa-shield-halved mr-1 text-blue-600"></i>
          <strong>Aviso de privacidad:</strong> Al abrir WhatsApp no se guarda reserva en firme de forma automática. Su información se remitirá exclusivamente al personal de atención de Taller Bautista.
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSend(true)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-brands fa-whatsapp text-lg"></i>
            <span>Enviar con mis datos</span>
          </button>

          <button
            type="button"
            onClick={() => handleSend(false)}
            className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm transition-colors"
          >
            Consulta genérica (sin datos)
          </button>
        </div>
      </div>
    </Modal>
  );
}
