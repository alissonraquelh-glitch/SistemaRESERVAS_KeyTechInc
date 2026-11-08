import React from 'react';

export default function StatusBadge({ status }) {
  let badgeClasses = 'bg-gray-100 text-gray-700 border-gray-200';
  let label = status || 'DESCONOCIDO';

  switch (status) {
    case 'PENDIENTE':
      badgeClasses = 'bg-amber-100 text-amber-700 border-amber-200';
      label = 'PENDIENTE';
      break;
    case 'EN_TALLER':
      badgeClasses = 'bg-indigo-100 text-indigo-700 border-indigo-200';
      label = 'EN TALLER';
      break;
    case 'COMPLETADO':
      badgeClasses = 'bg-emerald-100 text-emerald-700 border-emerald-200';
      label = 'COMPLETADO';
      break;
    case 'CANCELADO':
      badgeClasses = 'bg-red-100 text-red-700 border-red-200';
      label = 'CANCELADO';
      break;
    default:
      break;
  }

  return (
    <span
      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm inline-block ${badgeClasses}`}
    >
      {label}
    </span>
  );
}
