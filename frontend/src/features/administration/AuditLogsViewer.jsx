import React from 'react';
import { useAgenda } from '../../context/AgendaContext';

export default function AuditLogsViewer() {
  const { auditLogs } = useAgenda();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
      <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <i className="fa-solid fa-list-check text-indigo-500"></i>
            <span>Registro de Actividad y Auditoría</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Trazabilidad de modificaciones de citas, cambios de estado y ajustes de agenda.
          </p>
        </div>
        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
          {auditLogs.length} eventos
        </span>
      </div>

      <div className="bg-gray-900 text-gray-200 p-4 rounded-2xl font-mono text-xs max-h-64 overflow-y-auto space-y-2 border border-gray-800 shadow-inner">
        {auditLogs.length === 0 ? (
          <div className="text-gray-500 italic">No hay registros de actividad recientes.</div>
        ) : (
          auditLogs.map((log, idx) => (
            <div key={idx} className="leading-relaxed border-b border-gray-800/80 pb-1.5 last:border-0">
              <span className="text-emerald-400 select-none mr-2">&gt;</span>
              <span className="text-gray-300">{log}</span>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-500 flex items-start gap-2">
        <i className="fa-solid fa-database text-xs text-indigo-500 mt-0.5"></i>
        <span>
          <strong>Garantía de integridad:</strong> La tabla PostgreSQL <code>log_auditoria</code> cuenta con trigger <code>fn_log_inmutable()</code> que impide modificación o eliminación de eventos en el backend.
        </span>
      </div>
    </div>
  );
}
