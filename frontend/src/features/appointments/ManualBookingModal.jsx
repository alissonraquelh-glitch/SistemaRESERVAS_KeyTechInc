import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { useAgenda } from '../../context/AgendaContext';
import { useToast } from '../../context/ToastContext';
import { getMinimumBookingDate } from '../../utils/dateUtils';
import { formatDui, formatPhone, validateName, validatePhone } from '../../utils/formatters';
import { SERVICES_CATALOG, VEHICLE_TYPES } from '../../config/agenda';

export default function ManualBookingModal({ isOpen, onClose }) {
  const { config, availableSlots, getBookedCount, addAppointment } = useAgenda();
  const { showToast } = useToast();

  const minDate = getMinimumBookingDate(true); // Permite agendar hoy para personal

  const [clientName, setClientName] = useState('');
  const [dui, setDui] = useState('');
  const [phone, setPhone] = useState('');
  const [placa, setPlaca] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehType, setVehType] = useState('GENERAL');
  const [service, setService] = useState(SERVICES_CATALOG[0].name);
  const [date, setDate] = useState(minDate);
  const [timeSlot, setTimeSlot] = useState('');
  const [comments, setComments] = useState('');

  // Seleccionar primer slot disponible cuando cambie fecha o se abra
  useEffect(() => {
    if (isOpen) {
      if (availableSlots.length > 0) {
        setTimeSlot(availableSlots[0]);
      }
    }
  }, [isOpen, availableSlots]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateName(clientName)) {
      showToast("El nombre del cliente no puede contener números ni caracteres especiales.", "error");
      return;
    }

    if (!validatePhone(phone)) {
      showToast("El teléfono debe tener al menos 8 dígitos válidos.", "error");
      return;
    }

    if (!placa.trim()) {
      showToast("La placa del vehículo es obligatoria.", "error");
      return;
    }

    if (!timeSlot) {
      showToast("Debe seleccionar un intervalo de atención.", "error");
      return;
    }

    // Marca se extrae sin perder el modelo íntegro
    const brandGuessed = vehModel.trim().split(' ')[0] || 'Vehículo';

    const success = addAppointment({
      clientName: clientName.trim(),
      dui: dui.trim(),
      phone: phone.trim().startsWith('+503') ? phone.trim() : `+503 ${phone.trim()}`,
      placa: placa.trim().toUpperCase(),
      vehType,
      vehBrand: brandGuessed,
      vehModel: vehModel.trim() || 'Modelo no especificado',
      service,
      date,
      timeSlot,
      comments: comments.trim() || 'Sin comentarios',
    });

    if (success) {
      // Reset form
      setClientName('');
      setDui('');
      setPhone('');
      setPlaca('');
      setVehModel('');
      setComments('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registro Manual de Cita"
      subtitle="Agendamiento telefónico o presencial directo en el taller"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sección Cliente */}
        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
            Datos del Cliente
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej: Carmen Elena Rivas"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">DUI / NIT</label>
              <input
                type="text"
                placeholder="00000000-0"
                value={dui}
                onChange={(e) => setDui(formatDui(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono *</label>
              <input
                type="tel"
                required
                placeholder="7000-0000"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                maxLength={9}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red font-mono"
              />
            </div>
          </div>
        </div>

        {/* Sección Vehículo */}
        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
            Datos del Vehículo
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Placa *</label>
              <input
                type="text"
                required
                placeholder="P 123-456"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Vehículo</label>
              <select
                value={vehType}
                onChange={(e) => setVehType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Marca y Modelo *</label>
              <input
                type="text"
                required
                placeholder="Ej: Toyota Hilux 2020"
                value={vehModel}
                onChange={(e) => setVehModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red"
              />
            </div>
          </div>
        </div>

        {/* Sección Cita y Horario */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Servicio a Realizar *</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red font-bold"
            >
              {SERVICES_CATALOG.map((srv) => (
                <option key={srv.id} value={srv.name}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Atención *</label>
            <input
              type="date"
              required
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red font-bold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Intervalo Horario *</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red font-bold"
            >
              {availableSlots.map((slot) => {
                const booked = getBookedCount(date, slot);
                const max = config.maxCapacity;
                const isFull = booked >= max;
                return (
                  <option key={slot} value={slot} disabled={isFull}>
                    {slot} {isFull ? '(LLENO)' : `(${max - booked} cupos libres)`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Comentarios */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Comentarios / Instrucciones de Recepción
          </label>
          <textarea
            rows={2}
            placeholder="Observaciones sobre repuestos, fallas reportadas, etc."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red resize-none"
          ></textarea>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-bautista-red hover:bg-bautista-darkRed text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-check"></i>
            <span>Confirmar Registro</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
