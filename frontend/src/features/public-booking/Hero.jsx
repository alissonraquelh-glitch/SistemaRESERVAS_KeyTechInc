import React from "react";
import { useAgenda } from "../../context/AgendaContext";
import { CONTACTS_CONFIG } from "../../config/contacts";

export default function Hero({ onScrollToCalendar }) {
  const { config } = useAgenda();

  return (
    <section className="relative bg-bautista-dark text-white overflow-hidden py-16 lg:py-24 border-b border-white/10">
      {/* Luces de fondo y efectos visuales */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Contenido textual */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold tracking-wide uppercase text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {CONTACTS_CONFIG.branchName}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Expertos en tu tranquilidad
            </h1>

            <p className="text-base sm:text-lg text-gray-300 max-w-2xl font-normal leading-relaxed">
              Más de 48 años brindando servicio automotriz de alta precisión. Consulta nuestra disponibilidad en tiempo real y agenda en un solo clic. 
            </p>

            {/* Badges de Información Rápida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <i
                    aria-hidden="true"
                    className="fa-regular fa-clock text-lg"
                  ></i>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Horario de hoy
                  </div>
                  <div className="text-sm font-black text-white">
                    {config.openHour}
                    {config.closeHour ? ` - ${config.closeHour}` : ""}
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-location-dot text-lg"
                  ></i>
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Ubicación Central
                  </div>
                  <a
                    href={CONTACTS_CONFIG.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-white hover:text-blue-300 transition-colors truncate block"
                  >
                    San Miguel · Abrir Maps{" "}
                    <i
                      aria-hidden="true"
                      className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1"
                    ></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Botón CTA */}
            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <button
                type="button"
                onClick={onScrollToCalendar}
                className="px-6 py-3.5 rounded-2xl bg-bautista-red hover:bg-bautista-darkRed text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <i aria-hidden="true" className="fa-solid fa-calendar-days"></i>
                <span>Consultar Agenda Pública</span>
              </button>

              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <i
                  aria-hidden="true"
                  className="fa-solid fa-circle-check text-emerald-400"
                ></i>
                Solicitudes a partir de mañana
              </span>
            </div>
          </div>

          {/* Tarjeta Visual de Garantía / Estadísticas */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-2xl font-black text-white">
                    ¡Reserva con nosotros ya!
                  </div>
                </div>
                <div className="w-12 h-12 bg-bautista-red/20 text-bautista-red rounded-2xl flex items-center justify-center text-xl">
                  <i aria-hidden="true" className="fa-solid fa-wrench"></i>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <i class="fa-brands fa-whatsapp text-emerald-400 text-xl-mt-0.5"
                  ></i>
                  <div className="text-sm font-bold text-white">
                    Atención personalizada. Selecciona tu horario debajo y serás atendido inmediatamente por nuestro equipo vía WhatsApp. 
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
