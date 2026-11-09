import { useState } from "react";
import { useAgenda } from "../../context/AgendaContext";
import { useApiQuery } from "../../hooks/useApiQuery";
import { API_ROUTES as R } from "../../services/api/routes";
import { getTodayCivilDate } from "../../utils/dateUtils";
import RequestState from "../../components/ui/RequestState";
export default function BlockedDatesManager() {
  const { addBlockedDate, removeBlockedDate } = useAgenda();
  const query = useApiQuery(R.BLOQUEOS_LIST);
  const [date, setDate] = useState(""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false);
  const add = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (await addBlockedDate(date, reason)) {
        setDate("");
        setReason("");
      }
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id) => {
    if (busy) return;
    setBusy(true);
    try {
      await removeBlockedDate(id);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="bg-white rounded-3xl border shadow-soft p-6 space-y-4">
      <h3 className="text-lg font-black">Cierres de agenda</h3>
      <RequestState
        loading={query.loading}
        error={query.error}
        onRetry={query.reload}
      />
      <form onSubmit={add} className="flex flex-wrap gap-3 items-end">
        <label className="text-xs font-bold">
          Fecha
          <input
            className="block border rounded-xl p-3"
            type="date"
            required
            min={getTodayCivilDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="text-xs font-bold flex-1">
          Motivo público
          <input
            className="block border rounded-xl p-3 w-full"
            required
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button
          disabled={busy}
          className="bg-bautista-red text-white rounded-xl p-3 font-bold"
        >
          Cerrar fecha
        </button>
      </form>
      <div className="grid sm:grid-cols-2 gap-3">
        {(query.response?.data || []).map((b) => (
          <div
            className="p-4 bg-gray-50 rounded-xl flex justify-between gap-3"
            key={b.id_bloqueo}
          >
            <div>
              <strong>{b.fecha}</strong>
              <p className="text-sm">{b.motivo}</p>
            </div>
            <button
              disabled={busy}
              onClick={() => remove(b.id_bloqueo)}
              className="text-red-600 text-sm font-bold"
            >
              Retirar cierre
            </button>
          </div>
        ))}
      </div>
      {query.response && !query.response.data.length && (
        <p className="text-gray-400">No hay cierres programados.</p>
      )}
    </section>
  );
}
