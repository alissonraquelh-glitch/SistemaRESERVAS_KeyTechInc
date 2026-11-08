import React from 'react';
import { SERVICES_CATALOG } from '../../config/agenda';

export default function BrandsSection() {
  const brands = [
    'Toyota', 'Nissan', 'Honda', 'Hyundai', 'Kia',
    'Isuzu', 'Hino', 'Mitsubishi', 'Ford', 'Chevrolet'
  ];

  return (
    <section className="bg-white border-y border-gray-200 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Marcas atendidas */}
        <div>
          <div className="text-center mb-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Cobertura Multimarca
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              Marcas Principales que Atendemos en San Miguel
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {brands.map((brand) => (
              <span
                key={brand}
                className="px-5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 hover:border-gray-400 hover:shadow-sm transition-all shadow-inner"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>

        {/* Especialidades y Servicios Principales */}
        <div className="pt-8 border-t border-gray-100">
          <div className="text-center mb-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-bautista-red">
              Especialidades de Taller
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              Servicios Destacados de Taller Bautista
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES_CATALOG.map((srv, idx) => {
              const icons = [
                'fa-oil-can',
                'fa-microchip',
                'fa-compact-disc',
                'fa-arrows-to-dot',
              ];
              return (
                <div
                  key={srv.id}
                  className="p-6 rounded-3xl bg-gray-50/60 border border-gray-200 hover:border-bautista-red/40 hover:bg-white transition-all space-y-3 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-bautista-red flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                    <i className={`fa-solid ${icons[idx % icons.length]}`}></i>
                  </div>
                  <h4 className="font-black text-gray-900 text-base">{srv.name}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{srv.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
