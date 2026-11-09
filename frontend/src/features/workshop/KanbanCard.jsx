import React, { useState } from "react";

export default function KanbanCard({
  appointment,
  step,
  onMove,
  onEdit,
  busy,
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all space-y-3 cursor-default group">
      {/* Placa, edición y Folio */}
      <div className="flex justify-between items-start">
        <span className="px-3 py-1 rounded-lg bg-gray-900 text-white font-mono font-black text-xs shadow-sm">
          {appointment.placa}
        </span>
        <div className="flex items-center gap-2">
        </div>
      </div>

      {/* Vehículo y Servicio */}
      <div>
        <div className="font-black text-gray-900 text-sm uppercase tracking-wider">
          {appointment.vehBrand} {appointment.vehModel}
        </div>
        <div className="text-[11px] text-gray-500 font-bold mt-1 line-clamp-1">
          {appointment.service}
        </div>
      </div>

      {/* Fecha y Horario */}
      <div className="bg-gray-50 p-2.5 rounded-xl text-[10px] text-gray-600 font-medium flex justify-between items-center border border-gray-100">
        <span className="truncate pr-2 font-bold">
          <i
            aria-hidden="true"
            className="fa-regular fa-clock mr-1 text-gray-400"
          ></i>
          {appointment.timeSlot}
        </span>
        <span className="font-bold text-gray-400 shrink-0">
          {appointment.date}
        </span>
      </div>

      {/* Detalle Desplegable */}
      {isDetailsOpen && (
        <div className="mt-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-gray-700 space-y-1.5 fade-in">
          <p>
            <span className="font-bold text-blue-800">
              <i aria-hidden="true" className="fa-solid fa-user mr-1"></i>{" "}
              Cliente:
            </span>{" "}
            {appointment.clientName}
          </p>
          <p>
            <span className="font-bold text-blue-800">
              <i aria-hidden="true" className="fa-solid fa-phone mr-1"></i>{" "}
              Teléfono:
            </span>{" "}
            <a
              href={`tel:${appointment.phone.replace(/\s/g, "")}`}
              className="text-blue-600 underline font-mono"
            >
              {appointment.phone}
            </a>
          </p>
          <p>
            <span className="font-bold text-blue-800">
              <i aria-hidden="true" className="fa-solid fa-id-card mr-1"></i>{" "}
              DUI/NIT:
            </span>{" "}
            {appointment.dui || "N/A"}
          </p>
          <p>
            <span className="font-bold text-blue-800">
              <i aria-hidden="true" className="fa-solid fa-wrench mr-1"></i>{" "}
              Servicio:
            </span>{" "}
            {appointment.service}
          </p>
          <p>
            <span className="font-bold text-blue-800">
              <i aria-hidden="true" className="fa-solid fa-comment mr-1"></i>{" "}
              Comentarios:
            </span>{" "}
            {appointment.comments || "Sin comentarios"}
          </p>
        </div>
      )}

      {/* Botón Toggle de Detalles */}
      <button
        type="button"
        disabled={busy}
        onClick={() => setIsDetailsOpen((prev) => !prev)}
        className="w-full mt-2 py-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
      >
        <i
          aria-hidden="true"
          className={`fa-solid ${isDetailsOpen ? "fa-chevron-up" : "fa-chevron-down"}`}
        ></i>
        <span>
          {isDetailsOpen
            ? "Ocultar información"
            : "Info de contacto y vehículo"}
        </span>
      </button>

      {/* Botones de Transición Kanban */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
        {step > 1 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onMove(appointment.id, step - 1)}
            className="text-[10px] font-bold text-gray-400 hover:text-blue-500 transition-colors bg-gray-50 px-2 py-1.5 rounded-lg flex items-center gap-1"
          >
            <i aria-hidden="true" className="fa-solid fa-arrow-left"></i>
            <span>Ant.</span>
          </button>
        ) : (
          <span></span>
        )}

        {/* Botón Finalizar Rápido */}
        {step < 4 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onMove(appointment.id, 4)}
            className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 rounded-lg transition-all flex items-center gap-1"
          >
            <i aria-hidden="true" className="fa-solid fa-check-double"></i>
            <span>Finalizar</span>
          </button>
        ) : (
          <span></span>
        )}

        {step < 4 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onMove(appointment.id, step + 1)}
            className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg transition-all flex items-center gap-1"
          >
            <span>Sig.</span>
            <i aria-hidden="true" className="fa-solid fa-arrow-right"></i>
          </button>
        ) : (
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <i aria-hidden="true" className="fa-solid fa-check"></i> Completado
          </span>
        )}
      </div>
    </div>
  );
}
