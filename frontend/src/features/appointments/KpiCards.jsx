import React from 'react';

export default function KpiCards({ appointments }) {
  const total = appointments.length;
  const pendientes = appointments.filter((a) => a.status === 'PENDIENTE').length;
  const enTaller = appointments.filter((a) => a.status === 'EN_TALLER').length;
  const completadas = appointments.filter((a) => a.status === 'COMPLETADO').length;

  const kpis = [
    {
      label: 'Total de Citas',
      count: total,
      icon: 'fa-calendar-days',
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
    },
    {
      label: 'Pendientes',
      count: pendientes,
      icon: 'fa-clock',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'En Taller',
      count: enTaller,
      icon: 'fa-screwdriver-wrench',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Completadas',
      count: completadas,
      icon: 'fa-circle-check',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {k.label}
            </div>
            <div className={`text-2xl sm:text-3xl font-black mt-1 ${k.color}`}>
              {k.count}
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl ${k.bgColor} ${k.color} flex items-center justify-center text-xl shrink-0`}
          >
            <i className={`fa-solid ${k.icon}`}></i>
          </div>
        </div>
      ))}
    </div>
  );
}
