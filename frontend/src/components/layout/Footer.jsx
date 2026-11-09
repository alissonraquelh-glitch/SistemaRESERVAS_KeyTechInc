import React from "react";
import { CONTACTS_CONFIG } from "../../config/contacts";
import { useAuth } from "../../context/AuthContext";
import { useAgenda } from "../../context/AgendaContext";

export default function Footer({ onSwitchToEmployee }) {
  const { setIsLoginModalOpen, isAuthenticated } = useAuth();
  const { weekdays, publicError } = useAgenda();
  const dayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  const handleLockClick = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    } else if (onSwitchToEmployee) {
      onSwitchToEmployee();
    }
  };

  return (
    <footer className="bg-bautista-dark text-white border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          {/* Columna 1: Marca */}
          <div className="space-y-3">
            <div className="font-black text-lg tracking-tight text-white">
              {CONTACTS_CONFIG.companyName}
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Especialistas en mecánica preventiva y correctiva para vehículos
              livianos y pesados. Compromiso, garantía y tecnología en San
              Miguel.
            </p>
          </div>

          {/* Columna 2: Ubicación */}
          <div className="space-y-3">
            <div className="font-bold text-gray-200 uppercase tracking-wider text-xs">
              Ubicación y Sucursal
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              {CONTACTS_CONFIG.address}
            </p>
            <a
              href={CONTACTS_CONFIG.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
            >
              <i aria-hidden="true" className="fa-solid fa-location-dot"></i>
              <span>Abrir en Google Maps</span>
            </a>
          </div>

          {/* Columna 3: Horarios */}
          <div className="space-y-3">
            <div className="font-bold text-gray-200 uppercase tracking-wider text-xs">
              Horario de Atención
            </div>
            {weekdays.map((day) => (
              <p
                key={day.dia_semana}
                className="text-gray-400 text-xs flex justify-between gap-3"
              >
                <span>{dayNames[day.dia_semana]}</span>
                <span className="font-bold text-white">
                  {day.activo
                    ? `${day.hora_apertura.slice(0, 5)} - ${day.hora_cierre.slice(0, 5)}`
                    : "Cerrado"}
                </span>
              </p>
            ))}
            {!weekdays.length && (
              <p className="text-gray-400 text-xs">
                {publicError
                  ? "Horario no disponible."
                  : "Consultando horario…"}
              </p>
            )}
          </div>

          {/* Columna 4: Contacto & Aviso */}
          <div className="space-y-3">
            <div className="font-bold text-gray-200 uppercase tracking-wider text-xs">
              Canales Directos
            </div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-gray-500">Teléfono: </span>
                <a
                  href={`tel:${CONTACTS_CONFIG.phoneCall}`}
                  className="text-gray-300 hover:text-white font-bold"
                >
                  {CONTACTS_CONFIG.phoneDisplay}
                </a>
              </div>
              <div>
                <span className="text-gray-500">WhatsApp: </span>
                <span className="text-emerald-400 font-bold">
                  {CONTACTS_CONFIG.whatsAppDisplay}
                </span>
              </div>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[11px] text-gray-400 leading-normal">
              <i
                aria-hidden="true"
                className="fa-solid fa-triangle-exclamation text-amber-400 mr-1"
              ></i>
              La solicitud enviada por WhatsApp es preliminar y no constituye
              confirmación automática de cupo.
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} Grupo Bautista · Todos los
            derechos reservados.
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px]">San Miguel, El Salvador</span>
            {/* Candado de acceso administrativo / personal */}
            <button
              type="button"
              onClick={handleLockClick}
              title="Acceso seguro del personal"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Acceso para empleados"
            >
              <i aria-hidden="true" className="fa-solid fa-lock text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
