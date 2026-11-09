import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import RequestState from "../../components/ui/RequestState";
import { useAgenda } from "../../context/AgendaContext";
import { useApiQuery } from "../../hooks/useApiQuery";
import { API_ROUTES as R } from "../../services/api/routes";
import { getTodayCivilDate } from "../../utils/dateUtils";

const empty = () => ({
  clientName: "",
  dui: "",
  phone: "",
  placa: "",
  vehBrand: "",
  vehModel: "",
  vehType: "GENERAL",
  serviceCode: "",
  date: getTodayCivilDate(),
  timeSlot: "",
  comments: "",
});
const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-bautista-red";
export default function BookingForm({ isOpen, onClose, appointment }) {
  const { services, addAppointment, updateAppointment } = useAgenda();
  const [form, setForm] = useState(empty),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (isOpen) setForm(appointment ? { ...appointment } : empty());
  }, [isOpen, appointment]);
  useEffect(() => {
    if (!form.serviceCode && services.length)
      setForm((f) => ({ ...f, serviceCode: services[0].codigo }));
  }, [services, form.serviceCode]);
  const { response, loading, error, reload } = useApiQuery(
    R.INTERNAL_AVAILABILITY,
    { fecha: form.date, excluir_cita: appointment?.id },
    isOpen && Boolean(form.date),
  );
  const slots = response?.data?.intervalos || [];
  useEffect(() => {
    if (
      !appointment &&
      response &&
      !slots.some((s) => s.intervalo === form.timeSlot && s.disponibles > 0)
    )
      setForm((f) => ({
        ...f,
        timeSlot: slots.find((s) => s.disponibles > 0)?.intervalo || "",
      }));
  }, [response, appointment, form.timeSlot]);
  const set = (key) => (event) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));
  const field = (label, key, options = {}) => (
    <label className="block text-xs font-bold text-gray-700">
      {label}
      <input
        className={`${inputClass} mt-1`}
        value={form[key]}
        onChange={set(key)}
        required
        {...options}
      />
    </label>
  );
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const saved = appointment
        ? await updateAppointment(appointment.id, form)
        : await addAppointment(form);
      if (saved) onClose();
    } finally {
      setBusy(false);
    }
  };
  const hasCurrent =
    appointment?.date === form.date && appointment?.timeSlot === form.timeSlot;
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={appointment ? "Editar Cita" : "Registro Manual de Cita"}
      subtitle="Datos compartidos del cliente y vehículo; todos los cambios quedan en auditoría."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-5">
        {appointment && (
          <p className="text-xs break-all font-mono text-gray-500">
            Identificador: {appointment.id}
          </p>
        )}
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          <div className="p-4 bg-gray-50 rounded-2xl grid sm:grid-cols-3 gap-3">
            {field("Nombre completo *", "clientName", { maxLength: 150 })}
            {field("Documento de identidad *", "dui", { maxLength: 20 })}
            {field("Teléfono *", "phone", { type: "tel", maxLength: 20 })}
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl grid sm:grid-cols-2 gap-3">
            {field("Placa *", "placa", { maxLength: 20 })}
            <label className="text-xs font-bold text-gray-700">
              Tipo de vehículo
              <select
                aria-label="Tipo de vehículo"
                className={`${inputClass} mt-1`}
                value={form.vehType}
                onChange={set("vehType")}
              >
                <option value="GENERAL">GENERAL</option>
                <option value="PESADO">PESADO</option>
              </select>
            </label>
            {field("Marca *", "vehBrand", {
              maxLength: 50,
              placeholder: "Ej. Alfa Romeo",
            })}
            {field("Modelo *", "vehModel", {
              maxLength: 50,
              placeholder: "Ej. Giulia",
            })}
          </div>
          <label className="block text-xs font-bold text-gray-700">
            Servicio *
            <select
              aria-label="Servicio *"
              required
              className={`${inputClass} mt-1`}
              value={form.serviceCode}
              onChange={set("serviceCode")}
            >
              <option value="" disabled>
                Selecciona un servicio
              </option>
              {services.map((s) => (
                <option key={s.codigo} value={s.codigo}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {field("Fecha *", "date", {
              type: "date",
              min: appointment ? undefined : getTodayCivilDate(),
            })}
            <label className="text-xs font-bold text-gray-700">
              Intervalo *
              <select
                aria-label="Intervalo *"
                required
                className={`${inputClass} mt-1`}
                value={form.timeSlot}
                onChange={set("timeSlot")}
              >
                <option value="">Selecciona un intervalo</option>
                {appointment?.date === form.date &&
                  !slots.some((s) => s.intervalo === appointment.timeSlot) && (
                    <option value={appointment.timeSlot}>
                      {appointment.timeSlot} (actual)
                    </option>
                  )}
                {slots.map((s) => (
                  <option
                    key={s.intervalo}
                    value={s.intervalo}
                    disabled={s.disponibles === 0}
                  >
                    {s.intervalo} — {s.disponibles} cupos libres
                  </option>
                ))}
              </select>
            </label>
          </div>
          <RequestState loading={loading} error={error} onRetry={reload} />
          {response?.data?.cerrado && (
            <p role="status" className="text-amber-800">
              {response.data.motivo_cierre}
            </p>
          )}
          <label className="block text-xs font-bold text-gray-700">
            Comentarios
            <textarea
              className={`${inputClass} mt-1`}
              rows={2}
              maxLength={10000}
              value={form.comments}
              onChange={set("comments")}
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border font-bold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                busy ||
                !form.timeSlot ||
                !form.serviceCode ||
                (!hasCurrent && (loading || Boolean(error)))
              }
              className="px-6 py-2.5 bg-bautista-red text-white rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {busy
                ? "Guardando…"
                : appointment
                  ? "Guardar cambios"
                  : "Confirmar registro"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
