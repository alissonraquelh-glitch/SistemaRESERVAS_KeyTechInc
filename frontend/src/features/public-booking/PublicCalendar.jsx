import React, { useState } from 'react';
import { useAgenda } from '../../context/AgendaContext';
import { getTomorrowCivilDate, formatDateLongEs } from '../../utils/dateUtils';
import { getSlotShift } from '../../utils/timeSlots';
import TimeSlotCard from './TimeSlotCard';

export default function PublicCalendar({ onOpenWhatsAppModal }) {
  const { config, availableSlots, getBookedCount, isDateBlocked, getBlockReason } = useAgenda();
  const minDate = getTomorrowCivilDate();
  const [selectedDate, setSelectedDate] = useState(minDate);

  const blocked = isDateBlocked(selectedDate);
  const blockReason = blocked ? getBlockReason(selectedDate) : null;

  // Filtrar slots por turno
  const morningSlots = availableSlots.filter((slot) => getSlotShift(slot) === 'MANANA');
  const afternoonSlots = availableSlots.filter((slot) => getSlotShift(slot) === 'TARDE');

  return (
    <section id="agenda-publica" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Encabezado de sección */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-bautista-red font-black text-xs uppercase tracking-wider">
          <i className="fa-solid fa-calendar-check"></i>
          Disponibilidad en Vivo
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Consulta y Reserva de Horarios
        </h2>
        <p className="text-sm sm:text-base text-gray-500">
          Seleccione una fecha a partir de mañana para verificar los intervalos disponibles.
          Haga clic en una franja libre para iniciar su solicitud vía WhatsApp.
        </p>
      </div>

      {/* Selector de fecha y leyenda */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-soft mb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="w-full md:w-auto">
            <label
              htmlFor="public-calendar-date"
              className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2"
            >
              <i className="fa-regular fa-calendar-days text-bautista-red mr-1.5"></i>
              Fecha de consulta
            </label>
            <input
              id="public-calendar-date"
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-80 px-4 py-3 rounded-2xl border border-gray-300 font-bold text-gray-900 focus:ring-2 focus:ring-bautista-red focus:border-transparent outline-none shadow-sm cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1.5 capitalize font-medium">
              {formatDateLongEs(selectedDate)}
            </div>
          </div>

          {/* Leyenda de estados */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-bold text-gray-600 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Disponible
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Casi Lleno (≥ 60%)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              Agotado (100%)
            </span>
          </div>
        </div>
      </div>

      {/* Vista de franjas o estado bloqueado */}
      {blocked ? (
        <div className="p-12 bg-white rounded-3xl border border-gray-200 text-center space-y-4 shadow-sm max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
            <i className="fa-solid fa-calendar-xmark text-4xl"></i>
          </div>
          <h3 className="font-black text-gray-900 text-xl">
            Sin disponibilidad para esta fecha ({selectedDate})
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Motivo reportado: <strong className="text-gray-800">{blockReason}</strong>. Por favor
            selecciona otro día hábil en el calendario superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Turno de Mañana */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
              <i className="fa-solid fa-sun text-amber-500 text-xl"></i>
              <span>Turno de Mañana</span>
            </h3>

            {morningSlots.length > 0 ? (
              <div className="flex flex-col gap-4">
                {morningSlots.map((slot) => (
                  <TimeSlotCard
                    key={slot}
                    slot={slot}
                    bookedCount={getBookedCount(selectedDate, slot)}
                    maxCapacity={config.maxCapacity}
                    onSelectSlot={(selectedSlot) =>
                      onOpenWhatsAppModal(selectedDate, selectedSlot)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                Sin turnos configurados en esta franja
              </div>
            )}
          </div>

          {/* Turno de Tarde */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
              <i className="fa-solid fa-cloud-sun text-orange-500 text-xl"></i>
              <span>Turno de Tarde</span>
            </h3>

            {afternoonSlots.length > 0 ? (
              <div className="flex flex-col gap-4">
                {afternoonSlots.map((slot) => (
                  <TimeSlotCard
                    key={slot}
                    slot={slot}
                    bookedCount={getBookedCount(selectedDate, slot)}
                    maxCapacity={config.maxCapacity}
                    onSelectSlot={(selectedSlot) =>
                      onOpenWhatsAppModal(selectedDate, selectedSlot)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                Sin turnos configurados en esta franja
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nota legal / informativa sobre WhatsApp */}
      <div className="mt-12 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
        <i className="fa-solid fa-circle-info text-base text-amber-600 mt-0.5 shrink-0"></i>
        <div>
          <strong>Información Importante:</strong> El envío del mensaje a través de WhatsApp es una
          solicitud de pre-reserva y no garantiza la asignación inmediata del espacio. El personal del
          taller confirmará formalmente la cita tras verificar la recepción de su mensaje.
        </div>
      </div>
    </section>
  );
}
