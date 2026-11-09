import React from "react";
import { calculateSlotOccupancy } from "../../utils/timeSlots";

export default function TimeSlotCard({
  slot,
  bookedCount,
  maxCapacity,
  onSelectSlot,
}) {
  const { isFull, statusText, badgeColor, barColor, cardColor } =
    calculateSlotOccupancy(bookedCount, maxCapacity);

  return (
    <button
      type="button"
      disabled={isFull}
      onClick={() => !isFull && onSelectSlot(slot)}
      className={`p-5 rounded-2xl border flex items-center justify-between relative overflow-hidden group w-full text-left transition-all duration-300 ${cardColor}`}
    >
      {/* Barra de color indicadora a la izquierda */}
      <div
        className={`absolute top-0 left-0 h-full w-1.5 ${barColor} opacity-80 group-hover:opacity-100 transition-opacity`}
      ></div>

      {/* Intervalo de horas */}
      <div className="flex items-center text-lg sm:text-xl font-black text-gray-900 tracking-tight pl-3">
        <i
          aria-hidden="true"
          className="fa-regular fa-clock text-gray-400 mr-2 sm:mr-3 text-base sm:text-lg"
        ></i>
        <span>{slot}</span>
      </div>

      {/* Estado y botón WhatsApp */}
      <div className="flex items-center gap-2 sm:gap-4 z-10">
        <span
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-center ${badgeColor}`}
        >
          {statusText}
        </span>

        {!isFull && (
          <div className="bg-emerald-50 text-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-sm ml-1">
            <i aria-hidden="true" className="fa-brands fa-whatsapp text-xl"></i>
          </div>
        )}
      </div>
    </button>
  );
}
