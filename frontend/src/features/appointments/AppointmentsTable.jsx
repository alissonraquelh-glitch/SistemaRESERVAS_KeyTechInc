import StatusBadge from "../../components/ui/StatusBadge";
const control = "w-full px-4 py-2.5 border rounded-xl text-sm bg-white";
export default function AppointmentsTable({
  appointments,
  filters,
  setFilters,
  pagination,
  onEditAppointment,
  onChangeStatus,
  busy,
}) {
  const set = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value, offset: 0 }));
  return (
    <div className="bg-white rounded-3xl border shadow-soft overflow-hidden">
      <div className="p-5 bg-gray-50 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          aria-label="Buscar citas"
          className={control}
          placeholder="Cliente, placa, documento o identificador"
          value={filters.q}
          onChange={set("q")}
        />
        <select
          aria-label="Estado"
          className={control}
          value={filters.estado}
          onChange={set("estado")}
        >
          {["ALL", "PENDIENTE", "EN_TALLER", "COMPLETADO", "CANCELADO"].map(
            (s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "Todos los estados" : s.replace("_", " ")}
              </option>
            ),
          )}
        </select>
        <input
          aria-label="Fecha"
          className={control}
          type="date"
          value={filters.fecha}
          onChange={set("fecha")}
        />
        <select
          aria-label="Turno"
          className={control}
          value={filters.turno}
          onChange={set("turno")}
        >
          <option value="ALL">Todos los turnos</option>
          <option value="MANANA">Mañana</option>
          <option value="TARDE">Tarde</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              {[
                "Fecha y hora",
                "Cliente y contacto",
                "Vehículo y placa",
                "Servicio",
                "Estado",
                "Acciones",
              ].map((h) => (
                <th key={h} className="p-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <strong>{a.date}</strong>
                  <div>{a.timeSlot}</div>
                </td>
                <td className="p-4">
                  <strong>{a.clientName}</strong>
                  <div className="text-xs">{a.dui}</div>
                  <div className="text-xs">{a.phone}</div>
                </td>
                <td className="p-4">
                  <strong>{a.placa}</strong>
                  <div>
                    {a.vehBrand} {a.vehModel}
                  </div>
                  <div className="text-xs text-gray-400">{a.vehType}</div>
                </td>
                <td className="p-4">
                  {a.service}
                  <div className="text-xs text-gray-400">{a.comments}</div>
                </td>
                <td className="p-4">
                  <StatusBadge status={a.status} />
                </td>
                <td className="p-4">
                  <button
                    disabled={busy}
                    className="text-blue-600 font-bold mb-2"
                    onClick={() => onEditAppointment(a)}
                  >
                    Editar
                  </button>
                  <select
                    aria-label={"Estado de " + a.placa}
                    disabled={busy}
                    className={control}
                    value={a.status}
                    onChange={(e) => onChangeStatus(a.id, e.target.value)}
                  >
                    {["PENDIENTE", "EN_TALLER", "COMPLETADO", "CANCELADO"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </td>
              </tr>
            ))}
            {!appointments.length && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400">
                  No se encontraron citas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-between items-center gap-3 text-sm">
        <span>{pagination?.total ?? 0} citas encontradas</span>
        <div className="flex gap-4">
          <button
            disabled={busy || !filters.offset}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                offset: Math.max(0, f.offset - f.limit),
              }))
            }
          >
            Anterior
          </button>
          <span>Página {Math.floor(filters.offset / filters.limit) + 1}</span>
          <button
            disabled={
              busy ||
              !pagination ||
              filters.offset + filters.limit >= pagination.total
            }
            onClick={() =>
              setFilters((f) => ({ ...f, offset: f.offset + f.limit }))
            }
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
