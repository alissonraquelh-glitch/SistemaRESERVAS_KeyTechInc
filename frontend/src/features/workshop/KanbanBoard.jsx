import React, { useState } from "react";
import KanbanCard from "./KanbanCard";
import { getSlotShift } from "../../utils/timeSlots";

export default function KanbanBoard({
  appointments,
  onMoveKanban,
  onEditAppointment,
  filters,
  setFilters,
  columnsData,
  onLoadMore,
  busy,
}) {
  const filterDate = filters.fecha;
  const setFilterDate = (fecha) => setFilters((f) => ({ ...f, fecha }));
  const filterShift = filters.turno;
  const setFilterShift = (turno) => setFilters((f) => ({ ...f, turno }));

  const columns = [
    {
      step: 1,
      title: "Por Recepcionar",
      badgeClass: "bg-amber-100 text-amber-800",
      icon: "fa-inbox",
    },
    {
      step: 2,
      title: "En Diagnóstico",
      badgeClass: "bg-blue-100 text-blue-800",
      icon: "fa-stethoscope",
    },
    {
      step: 3,
      title: "En Reparación",
      badgeClass: "bg-purple-100 text-purple-800",
      icon: "fa-wrench",
    },
    {
      step: 4,
      title: "Completado",
      badgeClass: "bg-emerald-100 text-emerald-800",
      icon: "fa-circle-check",
    },
  ];

  // Excluir citas canceladas del tablero
  const activeAppointments = appointments.filter((a) => {
    if (a.status === "CANCELADO") return false;
    const shift = getSlotShift(a.timeSlot);
    const matchesDate = !filterDate || a.date === filterDate;
    const matchesShift = filterShift === "ALL" || shift === filterShift;
    return matchesDate && matchesShift;
  });

  return (
    <div className="space-y-6">
      {/* Filtros de Tablero */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <i
            aria-hidden="true"
            className="fa-solid fa-filter text-gray-400 text-sm"
          ></i>
          <span className="text-xs font-black uppercase tracking-wider text-gray-600">
            Filtros Operativos de Taller
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Filtro por Fecha */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold">Fecha:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white outline-none"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate("")}
                className="text-xs text-red-600 hover:underline font-bold"
              >
                Todas
              </button>
            )}
          </div>

          {/* Filtro por Turno */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold">Turno:</span>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white outline-none cursor-pointer"
            >
              <option value="ALL">Ambos Turnos</option>
              <option value="MANANA">Mañana</option>
              <option value="TARDE">Tarde</option>
            </select>
          </div>
        </div>
      </div>

      {/* Columnas Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {columns.map((col) => {
          const itemsInCol = activeAppointments.filter(
            (a) => a.kanbanStep === col.step,
          );
          const state = {
            1: "PENDIENTE",
            2: "EN_DIAGNOSTICO",
            3: "EN_REPARACION",
            4: "COMPLETADA",
          }[col.step];
          const total =
            columnsData.find((c) => c.estado === state)?.pagination.total || 0;

          return (
            <div
              key={col.step}
              className="bg-gray-100/70 p-4 rounded-3xl border border-gray-200/80 space-y-4"
            >
              {/* Encabezado de Columna */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-gray-800 uppercase tracking-wide">
                  <i
                    aria-hidden="true"
                    className={`fa-solid ${col.icon} text-gray-500`}
                  ></i>
                  <span>{col.title}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${col.badgeClass}`}
                >
                  {total}
                </span>
              </div>

              {itemsInCol.length < total && (
                <button
                  disabled={busy}
                  onClick={() => onLoadMore(state)}
                  className="text-sm font-bold text-blue-600"
                >
                  Cargar más ({itemsInCol.length}/{total})
                </button>
              )}
              {/* Lista de Tarjetas */}
              <div className="space-y-4">
                {itemsInCol.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 font-bold border-2 border-dashed border-gray-300 rounded-2xl bg-white/40">
                    Columna vacía
                  </div>
                ) : (
                  itemsInCol.map((a) => (
                    <KanbanCard
                      key={a.id}
                      appointment={a}
                      step={col.step}
                      busy={busy}
                      onMove={onMoveKanban}
                      onEdit={onEditAppointment}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
