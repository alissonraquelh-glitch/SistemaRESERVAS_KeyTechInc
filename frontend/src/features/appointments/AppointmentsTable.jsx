import React, { useState, useMemo } from 'react';
import StatusBadge from '../../components/ui/StatusBadge';
import { getSlotShift } from '../../utils/timeSlots';

export default function AppointmentsTable({ appointments, onEditAppointment, onChangeStatus }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [filterShift, setFilterShift] = useState('ALL');

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.clientName.toLowerCase().includes(q) ||
        a.placa.toLowerCase().includes(q) ||
        a.dui.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q);

      const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
      const matchesDate = !filterDate || a.date === filterDate;
      const shift = getSlotShift(a.timeSlot);
      const matchesShift = filterShift === 'ALL' || shift === filterShift;

      return matchesSearch && matchesStatus && matchesDate && matchesShift;
    });
  }, [appointments, search, filterStatus, filterDate, filterShift]);

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-6 border-b border-gray-200 bg-gray-50/50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda por texto */}
          <div className="md:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar por cliente, placa, DUI o folio (BK-xxx)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-300 text-sm focus:ring-2 focus:ring-bautista-red focus:border-transparent outline-none bg-white shadow-sm"
            />
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-700 bg-white focus:ring-2 focus:ring-bautista-red outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_TALLER">EN TALLER</option>
              <option value="COMPLETADO">COMPLETADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          {/* Filtro por Turno */}
          <div>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-700 bg-white focus:ring-2 focus:ring-bautista-red outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">Todos los Turnos</option>
              <option value="MANANA">Turno Mañana</option>
              <option value="TARDE">Turno Tarde</option>
            </select>
          </div>
        </div>

        {/* Filtro por Fecha específica */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500">Filtrar por fecha:</span>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white outline-none cursor-pointer"
          />
          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate('')}
              className="text-xs text-red-600 hover:underline font-bold"
            >
              Limpiar fecha
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100/80 text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-200">
              <th className="px-6 py-4">Fecha y Horario</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Vehículo</th>
              <th className="px-6 py-4">Servicio Solicitado</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400 font-bold bg-white">
                  No se encontraron citas coincidentes con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/80 transition-colors group">
                  {/* Fecha y Horario */}
                  <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fa-regular fa-calendar text-gray-400"></i>
                      <span>{a.date}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium flex items-center gap-2">
                      <i className="fa-regular fa-clock text-gray-400"></i>
                      <span>{a.timeSlot}</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-600 font-black mt-1 block">
                      {a.id}
                    </span>
                  </td>

                  {/* Cliente */}
                  <td className="px-6 py-4">
                    <div className="font-black text-gray-900 mb-1">{a.clientName}</div>
                    <div className="text-[11px] text-gray-500 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded-md">
                      DUI/NIT: {a.dui || 'N/A'}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded-md mt-1 block w-fit">
                      <i className="fa-solid fa-phone mr-1"></i>
                      {a.phone}
                    </div>
                  </td>

                  {/* Vehículo */}
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg bg-gray-900 text-white font-mono font-black text-xs shadow-sm inline-block">
                      {a.placa}
                    </span>
                    <div className="text-[11px] text-gray-700 font-bold mt-1.5 uppercase tracking-wider">
                      {a.vehBrand} {a.vehModel}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">{a.vehType}</div>
                  </td>

                  {/* Servicio */}
                  <td className="px-6 py-4 font-bold text-gray-700 text-xs">
                    <div>{a.service}</div>
                    <div className="text-[10px] text-gray-500 mt-1 font-normal italic">
                      <i className="fa-regular fa-comment mr-1"></i>
                      {a.comments || 'Sin comentarios'}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={a.status} />
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditAppointment(a)}
                        title="Editar Información"
                        className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center transition-colors shadow-sm"
                      >
                        <i className="fa-solid fa-pen text-xs"></i>
                      </button>

                      <select
                        value={a.status}
                        onChange={(e) => onChangeStatus(a.id, e.target.value)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-bautista-red cursor-pointer group-hover:border-gray-300 transition-colors"
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="EN_TALLER">EN TALLER</option>
                        <option value="COMPLETADO">COMPLETADO</option>
                        <option value="CANCELADO">CANCELADO</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
