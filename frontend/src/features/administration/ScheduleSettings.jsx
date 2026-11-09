import React, { useState, useEffect } from 'react';
import { useAgenda } from '../../context/AgendaContext';

export default function ScheduleSettings() {
  const { config, updateAgendaConfig } = useAgenda();

  const [openHour, setOpenHour] = useState(config.openHour);
  const [closeHour, setCloseHour] = useState(config.closeHour);
  const [maxCapacity, setMaxCapacity] = useState(config.maxCapacity);

  useEffect(() => {
    setOpenHour(config.openHour);
    setCloseHour(config.closeHour);
    setMaxCapacity(config.maxCapacity);
  }, [config]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateAgendaConfig({
      openHour,
      closeHour,
      maxCapacity: parseInt(maxCapacity, 10),
    });
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
          <i className="fa-solid fa-sliders text-bautista-red"></i>
          <span>Parámetros Generales de Agenda</span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Define el rango diario de atención y la capacidad máxima de vehículos simultáneos por bloque.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Hora de Apertura
            </label>
            <input
              type="time"
              required
              value={openHour}
              onChange={(e) => setOpenHour(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-bautista-red"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Hora de Cierre
            </label>
            <input
              type="time"
              required
              value={closeHour}
              onChange={(e) => setCloseHour(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-bautista-red"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Capacidad Máxima por Franja (1 - 15)
            </label>
            <input
              type="number"
              required
              min={1}
              max={15}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-bautista-red"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-bautista-red hover:bg-bautista-darkRed text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>Guardar Parámetros de Agenda</span>
          </button>
        </div>
      </form>
    </div>
  );
}
