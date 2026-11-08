import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DEFAULT_AGENDA_CONFIG, INITIAL_DEMO_APPOINTMENTS } from '../config/agenda';
import { toUIAppointment } from '../adapters/appointmentAdapter';
import { generateTimeSlots } from '../utils/timeSlots';
import { useToast } from './ToastContext';

const AgendaContext = createContext(null);
const STORAGE_KEY = 'BOOKIT_STATE_V6_4';

export function AgendaProvider({ children }) {
  const { showToast } = useToast();

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.config) return parsed.config;
      }
    } catch (e) {
      console.warn("No se pudo cargar estado previo:", e);
    }
    return DEFAULT_AGENDA_CONFIG;
  });

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.appointments) && parsed.appointments.length > 0) {
          return parsed.appointments.map(toUIAppointment);
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar citas previas:", e);
    }
    return INITIAL_DEMO_APPOINTMENTS.map(toUIAppointment);
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.logs)) return parsed.logs;
      }
    } catch (e) {
      console.warn("No se pudieron cargar logs:", e);
    }
    return [
      `[${new Date().toLocaleTimeString()}] Sistema Taller Bautista React iniciado correctamente.`,
      `[${new Date().toLocaleTimeString()}] Parámetros de agenda cargados.`
    ];
  });

  // Guardar en almacenamiento de sesión/local de demostración
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          config,
          appointments,
          logs: auditLogs,
        })
      );
    } catch (e) {
      console.error("Error al persistir estado local:", e);
    }
  }, [config, appointments, auditLogs]);

  // Registro de auditoría
  const logActivity = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${msg}`;
    setAuditLogs((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  // Comprobar si una fecha está bloqueada
  const isDateBlocked = useCallback(
    (dateStr) => {
      return config.blockedDates.some((b) => b.date === dateStr);
    },
    [config.blockedDates]
  );

  const getBlockReason = useCallback(
    (dateStr) => {
      const found = config.blockedDates.find((b) => b.date === dateStr);
      return found ? found.reason : 'Mantenimiento';
    },
    [config.blockedDates]
  );

  // Contar citas reservadas en un intervalo y fecha dada (excluyendo canceladas y cita en edición)
  const getBookedCount = useCallback(
    (dateStr, slotStr, excludeApptId = null) => {
      return appointments.filter((a) => {
        if (a.status === 'CANCELADO') return false;
        if (excludeApptId && a.id === excludeApptId) return false;
        return a.date === dateStr && a.timeSlot === slotStr;
      }).length;
    },
    [appointments]
  );

  // Registro manual de cita
  const addAppointment = useCallback(
    (apptData) => {
      const currentBooked = getBookedCount(apptData.date, apptData.timeSlot);
      if (currentBooked >= config.maxCapacity) {
        showToast("El horario seleccionado ya alcanzó la capacidad máxima.", "error");
        return false;
      }

      const newId = `BK-${Math.floor(100 + Math.random() * 900)}`;
      const normalized = toUIAppointment({
        ...apptData,
        id: newId,
        status: 'PENDIENTE',
        kanbanStep: 1,
        createdAt: new Date().toLocaleString(),
      });

      setAppointments((prev) => [normalized, ...prev]);
      logActivity(`Cita manual registrada: ${newId} (${normalized.placa})`);
      showToast(`Cita ${newId} registrada correctamente.`, "success");
      return true;
    },
    [config.maxCapacity, getBookedCount, logActivity, showToast]
  );

  // Edición de cita
  const updateAppointment = useCallback(
    (id, updatedFields) => {
      let isSuccess = false;

      setAppointments((prev) => {
        const index = prev.findIndex((a) => a.id === id);
        if (index === -1) return prev;

        const current = prev[index];
        const newDate = updatedFields.date || current.date;
        const newSlot = updatedFields.timeSlot || current.timeSlot;

        // Si se cambia de fecha u horario, validar capacidad excluyendo la cita actual
        if (newDate !== current.date || newSlot !== current.timeSlot) {
          const bookedInNew = getBookedCount(newDate, newSlot, id);
          if (bookedInNew >= config.maxCapacity) {
            showToast("El nuevo horario elegido ya está lleno. Selecciona otro.", "error");
            return prev;
          }
        }

        const updated = toUIAppointment({
          ...current,
          ...updatedFields,
        });

        const nextList = [...prev];
        nextList[index] = updated;
        isSuccess = true;
        return nextList;
      });

      if (isSuccess) {
        logActivity(`Cita editada: ${id}`);
        showToast("Información de la cita actualizada correctamente.", "success");
      }
      return isSuccess;
    },
    [config.maxCapacity, getBookedCount, logActivity, showToast]
  );

  // Cambio de estado
  const changeAppointmentStatus = useCallback(
    (id, newStatus) => {
      setAppointments((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;

          let kanbanStep = a.kanbanStep;
          if (newStatus === 'PENDIENTE') kanbanStep = 1;
          else if (newStatus === 'EN_TALLER') kanbanStep = 2;
          else if (newStatus === 'COMPLETADO') kanbanStep = 4;

          return { ...a, status: newStatus, kanbanStep };
        })
      );
      logActivity(`Estado de cita ${id} cambiado a ${newStatus}`);
      showToast(`Estado de la cita actualizado a ${newStatus}`, "success");
    },
    [logActivity, showToast]
  );

  // Cambio de etapa Kanban
  const changeKanbanStep = useCallback(
    (id, newStep) => {
      setAppointments((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;

          let status = a.status;
          if (newStep === 1) status = 'PENDIENTE';
          else if (newStep === 2 || newStep === 3) status = 'EN_TALLER';
          else if (newStep === 4) status = 'COMPLETADO';

          return { ...a, kanbanStep: newStep, status };
        })
      );
      logActivity(`Cita ${id} movida a etapa Kanban ${newStep}`);
      showToast(`Etapa de taller actualizada (Paso ${newStep})`, "success");
    },
    [logActivity, showToast]
  );

  // Ajustes de agenda (Administración)
  const updateAgendaConfig = useCallback(
    (newConfig) => {
      setConfig((prev) => ({
        ...prev,
        ...newConfig,
      }));
      logActivity(`Parámetros de agenda actualizados: ${newConfig.openHour}-${newConfig.closeHour}, capacidad: ${newConfig.maxCapacity}`);
      showToast("Configuración de agenda guardada con éxito.", "success");
    },
    [logActivity, showToast]
  );

  // Agregar fecha bloqueada
  const addBlockedDate = useCallback(
    (date, reason) => {
      if (config.blockedDates.some((b) => b.date === date)) {
        showToast("Esta fecha ya se encuentra bloqueada.", "error");
        return false;
      }
      setConfig((prev) => ({
        ...prev,
        blockedDates: [...prev.blockedDates, { date, reason: reason || 'Mantenimiento' }],
      }));
      logActivity(`Fecha bloqueada: ${date} (${reason})`);
      showToast("Fecha bloqueada en la agenda pública.", "success");
      return true;
    },
    [config.blockedDates, logActivity, showToast]
  );

  // Eliminar fecha bloqueada
  const removeBlockedDate = useCallback(
    (index) => {
      const removed = config.blockedDates[index];
      setConfig((prev) => ({
        ...prev,
        blockedDates: prev.blockedDates.filter((_, i) => i !== index),
      }));
      if (removed) {
        logActivity(`Bloqueo de fecha removido: ${removed.date}`);
        showToast("Bloqueo de fecha eliminado correctamente.", "success");
      }
    },
    [config.blockedDates, logActivity, showToast]
  );

  // Slots dinámicos calculados a partir de config
  const availableSlots = generateTimeSlots(config.openHour, config.closeHour);

  return (
    <AgendaContext.Provider
      value={{
        config,
        appointments,
        auditLogs,
        availableSlots,
        getBookedCount,
        isDateBlocked,
        getBlockReason,
        addAppointment,
        updateAppointment,
        changeAppointmentStatus,
        changeKanbanStep,
        updateAgendaConfig,
        addBlockedDate,
        removeBlockedDate,
        logActivity,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
}

export function useAgenda() {
  const ctx = useContext(AgendaContext);
  if (!ctx) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return ctx;
}
