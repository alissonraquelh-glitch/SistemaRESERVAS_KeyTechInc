import React, { useState } from 'react';
import { useAgenda } from '../../context/AgendaContext';
import { useToast } from '../../context/ToastContext';
import { getTodayCivilDate } from '../../utils/dateUtils';

export default function BlockedDatesManager() {
  const { config, addBlockedDate, removeBlockedDate } = useAgenda();
  const { showToast } = useToast();

  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const handleAddBlock = (e) => {
    e.preventDefault();
    if (!date) {
      showToast("Seleccione una fecha a bloquear.", "error");
      return;
    }
    const success = addBlockedDate(date, reason.trim() || 'Cierre Administrativo');
    if (success) {
      setDate('');
      setReason('');
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
          <i className="fa-solid fa-calendar-xmark text-amber-500"></i>
          <span>Gestión de Cierres de Agenda (Fechas Bloqueadas)</span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Suspende la disponibilidad de fechas completas por festivos, capacitaciones o mantenimiento general.
        </p>
      </div>

      {/* Formulario de Nuevo Bloqueo */}
      <form onSubmit={handleAddBlock} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-4">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Fecha a Bloquear *
          </label>
          <input
            type="date"
            required
            min={getTodayCivilDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-bautista-red"
          />
        </div>

        <div className="sm:col-span-6">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Motivo Público Visible *
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Asueto Nacional / Mantenimiento Eléctrico"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-bautista-red"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Bloquear</span>
          </button>
        </div>
      </form>

      {/* Listado de Fechas Bloqueadas */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-black uppercase tracking-wider text-gray-400 block">
          Fechas Actualmente Bloqueadas ({config.blockedDates.length})
        </span>

        {config.blockedDates.length === 0 ? (
          <div className="text-xs text-gray-400 italic p-4 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            No hay fechas bloqueadas programadas en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.blockedDates.map((b, index) => (
              <div
                key={b.date}
                className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl"
              >
                <div>
                  <div className="font-bold text-gray-900 text-xs sm:text-sm">{b.date}</div>
                  <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                    {b.reason}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeBlockedDate(index)}
                  title="Eliminar Bloqueo"
                  className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
