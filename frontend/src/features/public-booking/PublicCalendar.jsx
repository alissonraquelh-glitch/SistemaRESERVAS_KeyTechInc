import { useEffect, useState } from "react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { API_ROUTES as R } from "../../services/api/routes";
import { getTomorrowCivilDate, formatDateLongEs } from "../../utils/dateUtils";
import RequestState from "../../components/ui/RequestState";
export default function PublicCalendar({ onOpenWhatsAppModal }) {
  const [date, setDate] = useState(getTomorrowCivilDate);
  const { response, loading, error, reload } = useApiQuery(
    R.PUBLIC_AVAILABILITY,
    { fecha: date },
  );
  useEffect(() => {
    const timer = setInterval(reload, 30000);
    window.addEventListener("focus", reload);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", reload);
    };
  }, [reload]);
  const data = response?.data;
  return (
    <section
      id="agenda-publica"
      className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-3">
          Consulta y Reserva de Horarios
        </h2>
        <p className="text-gray-500">
          Selecciona una fecha a partir de mañana. Elige un horario y pulsa
          {" “Consultar por WhatsApp” "}para comunicarte con recepción.
        </p>
      </div>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600 mt-0.5">
              <i aria-hidden="true" className="fa-solid fa-clock-rotate-left text-lg"></i>
          </div>
          <div>
              <h4 className="font-black text-blue-800 text-sm mb-1">Regla de Anticipación</h4>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">Haz tu reserva con al menos <strong>24 horas de anticipación</strong>. Nuestra agenda para el mismo día suele estar cubierta.</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600 mt-0.5">
              <i aria-hidden="true" className="fa-solid fa-clipboard-check text-lg"></i>
          </div>
          <div>
              <h4 className="font-black text-amber-800 text-sm mb-1">Estado de tu Reserva</h4>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">Tu solicitud <strong>no está confirmada</strong> hasta que un asesor te contacte. El horario seguirá <em>"disponible"</em> hasta oficializarlo.</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl border shadow-soft mb-8 flex flex-wrap justify-between gap-4">
        <label className="text-sm font-bold">
          Fecha a consultar
          <input
            type="date"
            value={date}
            min={getTomorrowCivilDate()}
            onChange={(e) => setDate(e.target.value)}
            className="block border p-3 rounded-xl mt-2"
          />
        </label>
        <p className="self-center text-gray-500 capitalize">
          {formatDateLongEs(date)}
        </p>
      </div>
      <RequestState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && data?.cerrado && (
        <div className="p-12 text-center bg-white rounded-3xl border">
          <h3 className="font-black text-xl mb-2">
            Sin disponibilidad para esta fecha
          </h3>
          <p>{data.motivo_cierre}</p>
        </div>
      )}
      {!loading && !error && data && !data.cerrado && (
        <div className="grid lg:grid-cols-2 gap-8">
          {["MANANA", "TARDE"].map((turno) => (
            <div key={turno}>
              <h3 className="font-black text-lg border-b pb-3 mb-4">
                {turno === "MANANA" ? "Turno de Mañana" : "Turno de Tarde"}
              </h3>
              <div className="space-y-3">
                {data.intervalos
                  .filter((s) => s.turno === turno)
                  .map((s) => {
                    const full = !s.disponibles,
                      almost = s.estado === "CASI_LLENO";
                    return (
                      <div
                        key={s.inicio}
                        className={
                          "w-full text-left border rounded-2xl p-5 space-y-4 " +
                          (full
                            ? "bg-gray-100 text-gray-400"
                            : "bg-white hover:border-emerald-400 hover:shadow-lg")
                        }
                      >
                        <div className="flex flex-wrap justify-between items-center gap-3">
                          <span className="text-lg font-black">
                            <i aria-hidden="true" className="fa-regular fa-clock mr-2 text-gray-400"></i>
                            {s.intervalo}
                          </span>
                          <span
                            className={
                              "text-xs font-bold rounded-lg p-2 " +
                              (full
                                ? "bg-gray-200"
                                : almost
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800")
                            }
                          >
                            {s.estado === "BLOQUEADO"
                              ? s.motivo_cierre || "Cerrado"
                              : full
                                ? "Sin cupos"
                                : almost
                                  ? "Casi lleno"
                                  : "Disponible"}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={full}
                          aria-label={
                            full
                              ? `Sin cupos para ${s.intervalo}`
                              : `Consultar por WhatsApp el horario ${s.intervalo}`
                          }
                          onClick={() => onOpenWhatsAppModal(date, s.intervalo)}
                          className={
                            "w-full min-h-12 px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 " +
                            (full
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-emerald-600 text-white hover:bg-emerald-700")
                          }
                        >
                          <i aria-hidden="true" className="fa-brands fa-whatsapp text-lg"></i>
                          {full ? "Sin cupos" : "Consultar por WhatsApp"}
                        </button>
                      </div>
                    );
                  })}
                {!data.intervalos.some((s) => s.turno === turno) && (
                  <p className="p-6 text-gray-400 border-2 border-dashed rounded-2xl">
                    Sin turnos en esta franja
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
