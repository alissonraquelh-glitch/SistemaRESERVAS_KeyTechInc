import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiRequest } from "../services/api/client";
import { API_ROUTES as R } from "../services/api/routes";
import { toBackendAppointmentPayload } from "../adapters/appointmentAdapter";
import { useToast } from "./ToastContext";
import { getTodayCivilDate } from "../utils/dateUtils";
const AgendaContext = createContext(null);
export function AgendaProvider({ children }) {
  const { showToast } = useToast();
  const [revision, setRevision] = useState(0),
    [weekdays, setWeekdays] = useState([]),
    [services, setServices] = useState([]),
    [publicError, setPublicError] = useState(null);
  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      apiRequest(R.PUBLIC_AGENDA, { signal: c.signal }),
      apiRequest(R.SERVICES, { signal: c.signal }),
    ])
      .then(([a, s]) => {
        setWeekdays(a.data);
        setServices(s.data);
        setPublicError(null);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setPublicError(e.message);
      });
    return () => c.abort();
  }, [revision]);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  const mutate = useCallback(
    async (route, body, pathParams, message) => {
      try {
        const r = await apiRequest(route, { body, pathParams });
        refresh();
        showToast(message, "success");
        return r.data;
      } catch (e) {
        showToast(e.message, "error");
        refresh();
        return null;
      }
    },
    [refresh, showToast],
  );
  const addAppointment = useCallback(
    (ui) =>
      mutate(
        R.CITAS_CREATE_MANUAL,
        toBackendAppointmentPayload(ui),
        {},
        "Cita registrada.",
      ),
    [mutate],
  );
  const updateAppointment = useCallback(
    (id, ui) =>
      mutate(
        R.CITAS_UPDATE,
        toBackendAppointmentPayload(ui),
        { id },
        "Cita actualizada.",
      ),
    [mutate],
  );
  const changeAppointmentStatus = useCallback(
    async (id, status, current) => {
      const estado =
        {
          COMPLETADO: "COMPLETADA",
          CANCELADO: "CANCELADA",
          EN_TALLER:
            current === "EN_REPARACION" ? "EN_REPARACION" : "EN_DIAGNOSTICO",
        }[status] || status;
      return mutate(
        R.CITAS_CHANGE_STATUS,
        { estado },
        { id },
        "Estado actualizado.",
      );
    },
    [mutate],
  );
  const changeKanbanStep = useCallback(
    (id, step) =>
      mutate(
        R.CITAS_CHANGE_STATUS,
        {
          estado: {
            1: "PENDIENTE",
            2: "EN_DIAGNOSTICO",
            3: "EN_REPARACION",
            4: "COMPLETADA",
          }[step],
        },
        { id },
        "Etapa actualizada.",
      ),
    [mutate],
  );
  const updateAgendaConfig = useCallback(
    (dias) =>
      mutate(R.CONFIG_AGENDA_UPDATE, { dias }, {}, "Configuración guardada."),
    [mutate],
  );
  const addBlockedDate = useCallback(
    (fecha, motivo) =>
      mutate(R.BLOQUEOS_CREATE, { fecha, motivo }, {}, "Fecha cerrada."),
    [mutate],
  );
  const removeBlockedDate = useCallback(
    (id) => mutate(R.BLOQUEOS_DELETE, {}, { id }, "Cierre retirado."),
    [mutate],
  );
  const weekday = new Date(getTodayCivilDate() + "T12:00:00Z").getUTCDay();
  const day = weekdays.find((d) => d.dia_semana === weekday);
  const config = {
    openHour: day?.activo
      ? day.hora_apertura.slice(0, 5)
      : weekdays.length
        ? "Cerrado"
        : publicError
          ? "No disponible"
          : "Consultando…",
    closeHour: day?.activo ? day.hora_cierre.slice(0, 5) : "",
    maxCapacity: day?.capacidad_maxima,
  };
  return (
    <AgendaContext.Provider
      value={{
        revision,
        refresh,
        services,
        weekdays,
        publicError,
        config,
        addAppointment,
        updateAppointment,
        changeAppointmentStatus,
        changeKanbanStep,
        updateAgendaConfig,
        addBlockedDate,
        removeBlockedDate,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
}
export function useAgenda() {
  return useContext(AgendaContext);
}
