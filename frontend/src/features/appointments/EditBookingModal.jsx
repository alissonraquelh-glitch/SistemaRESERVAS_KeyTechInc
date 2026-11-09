import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { useAgenda } from '../../context/AgendaContext';
import { useToast } from '../../context/ToastContext';
import { getMinimumBookingDate } from '../../utils/dateUtils';
import { formatDui, formatPhone, validateName, validatePhone } from '../../utils/formatters';
import { SERVICES_CATALOG } from '../../config/agenda';

export default function EditBookingModal({ isOpen, onClose, appointment }) {
  const { config, availableSlots, getBookedCount, updateAppointment } = useAgenda();
  const { showToast } = useToast();

  const minDate = getMinimumBookingDate(true);

  const [clientName, setClientName] = useState('');
  const [dui, setDui] = useState('');
  const [phone, setPhone] = useState('');
  const [placa, setPlaca] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (appointment && isOpen) {
      setClientName(appointment.clientName || '');
      setDui(appointment.dui || '');
      setPhone(appointment.phone ? appointment.phone.replace('+503 ', '') : '');
      setPlaca(appointment.placa || '');
      setVehModel(appointment.vehModel || '');
      setService(appointment.service || SERVICES_CATALOG[0].name);
      setDate(appointment.date || minDate);
      setTimeSlot(appointment.timeSlot || '');
      setComments(appointment.comments === 'Sin comentarios' ? '' : appointment.comments || '');
    }
  }, [appointment, isOpen, minDate]);

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

    const brandGuessed = vehModel.trim().split(' ')[0] || appointment.vehBrand || 'Vehículo';

    const success = updateAppointment(appointment.id, {
      clientName: clientName.trim(),
      dui: dui.trim(),
      phone: phone.trim().startsWith('+503') ? phone.trim() : `+503 ${phone.trim()}`,
      placa: placa.trim().toUpperCase(),
      vehBrand: brandGuessed,
      vehModel: vehModel.trim() || 'Modelo no especificado',
      service,
      date,
      timeSlot,
      comments: comments.trim() || 'Sin comentarios',
    });

    if (success) {
      onClose();
    }
  };

  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Cita ${appointment.id}`}
      subtitle="Modificación de datos del cliente, vehículo y reprogramación de horario"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Folio y estado actual */}
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-700">
          <span>Folio: <strong className="text-red-600 font-mono">{appointment.id}</strong></span>
          <span>Estado actual: <strong className="text-gray-900">{appointment.status}</strong></span>
        </div>

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
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">DUI / NIT</label>
              <input
                type="text"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Placa *</label>
              <input
                type="text"
                required
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Marca y Modelo *</label>
              <input
                type="text"
                required
                value={vehModel}
                onChange={(e) => setVehModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red"
              />
            </div>
          </div>
        </div>

        {/* Sección Servicio y Reprogramación */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Servicio *</label>
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
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha *</label>
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
                // Al consultar cupo, excluimos la cita actual para no auto-bloquearse si mantiene su turno
                const booked = getBookedCount(date, slot, appointment.id);
                const max = config.maxCapacity;
                const isFull = booked >= max;
                const isCurrent = appointment.date === date && appointment.timeSlot === slot;

                return (
                  <option key={slot} value={slot} disabled={isFull && !isCurrent}>
                    {slot} {isCurrent ? '(HORARIO ACTUAL)' : isFull ? '(LLENO)' : `(${max - booked} libres)`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Comentarios */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Comentarios</label>
          <textarea
            rows={2}
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
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-save"></i>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
