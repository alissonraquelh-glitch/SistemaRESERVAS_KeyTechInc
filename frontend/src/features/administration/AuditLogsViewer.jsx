import { useState } from "react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { API_ROUTES as R } from "../../services/api/routes";
import RequestState from "../../components/ui/RequestState";
export default function AuditLogsViewer() {
  const [offset, setOffset] = useState(0);
  const query = useApiQuery(R.AUDITORIA_LOGS, { limit: 25, offset });
  const page = query.response?.pagination;
  return (
    <section className="bg-white rounded-3xl border shadow-soft p-6 space-y-4">
      <h3 className="text-lg font-black">Auditoría de actividad</h3>
      <RequestState
        loading={query.loading}
        error={query.error}
        onRetry={query.reload}
      />
      <div className="bg-gray-900 p-4 rounded-2xl font-mono text-xs text-gray-200 max-h-80 overflow-auto space-y-3">
        {(query.response?.data || []).map((log) => (
          <details key={log.id_log} className="border-b border-gray-700 pb-2">
            <summary className="cursor-pointer">
              {log.ocurrio_en} — {log.empleado}: {log.accion}
            </summary>
            <pre className="whitespace-pre-wrap break-all mt-2 text-gray-400">
              {JSON.stringify(log.detalle, null, 2)}
            </pre>
          </details>
        ))}
        {query.response && !query.response.data.length && (
          <p>No hay actividad registrada.</p>
        )}
      </div>
      <div className="flex gap-5 text-sm">
        <button
          disabled={query.loading || !offset}
          onClick={() => setOffset((o) => Math.max(0, o - 25))}
        >
          Anterior
        </button>
        <span>{page?.total ?? 0} eventos</span>
        <button
          disabled={query.loading || !page || offset + 25 >= page.total}
          onClick={() => setOffset((o) => o + 25)}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
