import React from 'react';
import ScheduleSettings from './ScheduleSettings';
import BlockedDatesManager from './BlockedDatesManager';
import AuditLogsViewer from './AuditLogsViewer';

export default function AdminView() {
  return (
    <div className="space-y-8 fade-in">
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Panel de Administración y Configuración
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Control de reglas de negocio, horarios del taller, cierres programados y auditoría del sistema.
        </p>
      </div>

      {/* Configuración de Horarios y Capacidad */}
      <ScheduleSettings />

      {/* Fechas Bloqueadas */}
      <BlockedDatesManager />

      {/* Logs de Auditoría */}
      <AuditLogsViewer />
    </div>
  );
}
