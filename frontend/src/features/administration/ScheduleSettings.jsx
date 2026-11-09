import { useEffect, useState } from "react";
import { useAgenda } from "../../context/AgendaContext";
import { useApiQuery } from "../../hooks/useApiQuery";
import { API_ROUTES as R } from "../../services/api/routes";
import RequestState from "../../components/ui/RequestState";
const names = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
export default function ScheduleSettings() {
  const { updateAgendaConfig } = useAgenda();
  const query = useApiQuery(R.CONFIG_AGENDA_GET);
  const [days, setDays] = useState([]),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (query.response)
      setDays(
        names.map((_, dia_semana) => {
          const row = query.response.data.find(
            (d) => d.dia_semana === dia_semana,
          );
          return row
            ? {
                dia_semana,
                hora_apertura: row.hora_apertura.slice(0, 5),
                hora_cierre: row.hora_cierre.slice(0, 5),
                duracion_bloque_min: row.duracion_bloque_min,
                capacidad_maxima: row.capacidad_maxima,
                activo: row.activo,
              }
            : {
                dia_semana,
                hora_apertura: "08:00",
                hora_cierre: "18:00",
                duracion_bloque_min: 120,
                capacidad_maxima: 1,
                activo: false,
              };
        }),
      );
  }, [query.response]);
  const set = (index, key, value) =>
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [key]: value } : d)),
    );
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await updateAgendaConfig(days);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="bg-white rounded-3xl border shadow-soft p-6 space-y-4">
      <h3 className="text-lg font-black">Horarios y capacidad por día</h3>
      <p className="text-xs text-gray-500">
        Los cambios que dejen citas activas fuera de horario o sin capacidad
        serán rechazados.
      </p>
      <RequestState
        loading={query.loading}
        error={query.error}
        onRetry={query.reload}
      />
      <form onSubmit={submit}>
        <fieldset disabled={busy || query.loading} className="space-y-3">
          {days.map((d, i) => (
            <div
              key={d.dia_semana}
              className="grid sm:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <label className="font-bold text-sm flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={d.activo}
                  onChange={(e) => set(i, "activo", e.target.checked)}
                />
                {names[d.dia_semana]}
              </label>
              {["hora_apertura", "hora_cierre"].map((key, j) => (
                <label key={key} className="text-xs">
                  {j ? "Cierre" : "Apertura"}
                  <input
                    className="block border p-2 rounded-lg w-full"
                    type="time"
                    required
                    value={d[key]}
                    onChange={(e) => set(i, key, e.target.value)}
                  />
                </label>
              ))}
              <label className="text-xs">
                Minutos por bloque
                <input
                  className="block border p-2 rounded-lg w-full"
                  type="number"
                  required
                  min="1"
                  max="1440"
                  value={d.duracion_bloque_min}
                  onChange={(e) =>
                    set(i, "duracion_bloque_min", Number(e.target.value))
                  }
                />
              </label>
              <label className="text-xs">
                Capacidad
                <input
                  className="block border p-2 rounded-lg w-full"
                  type="number"
                  required
                  min="1"
                  max="15"
                  value={d.capacidad_maxima}
                  onChange={(e) =>
                    set(i, "capacidad_maxima", Number(e.target.value))
                  }
                />
              </label>
            </div>
          ))}
          <button
            disabled={busy || days.length !== 7 || !!query.error}
            className="px-6 py-3 rounded-xl bg-bautista-red text-white font-bold disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar semana"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
