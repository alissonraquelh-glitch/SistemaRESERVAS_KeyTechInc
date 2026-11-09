import { useState } from "react";
import { useAgenda } from "../../context/AgendaContext";
import { useApiQuery } from "../../hooks/useApiQuery";
import { API_ROUTES as R } from "../../services/api/routes";
import { toUIAppointment } from "../../adapters/appointmentAdapter";
import RequestState from "../../components/ui/RequestState";
import KpiCards from "./KpiCards";
import AppointmentsTable from "./AppointmentsTable";
import ManualBookingModal from "./ManualBookingModal";
import EditBookingModal from "./EditBookingModal";
export default function SecretaryView() {
  const { services, changeAppointmentStatus } = useAgenda();
  const [filters, setFilters] = useState({
    q: "",
    fecha: "",
    turno: "ALL",
    estado: "ALL",
    limit: 25,
    offset: 0,
  });
  const [manual, setManual] = useState(false),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false);
  const list = useApiQuery(R.CITAS_LIST, filters),
    summary = useApiQuery(R.CITAS_SUMMARY);
  const appointments = (list.response?.data || []).map((r) =>
    toUIAppointment(r, services),
  );
  const change = async (id, status) => {
    if (busy) return;
    setBusy(true);
    try {
      await changeAppointmentStatus(
        id,
        status,
        appointments.find((a) => a.id === id)?.detailedStatus,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-8 fade-in">
      <div className="bg-white p-6 rounded-3xl border shadow-soft flex flex-wrap gap-4 justify-between">
        <div>
          <h2 className="text-xl font-black">
            Recepción y Control de Citas (Secretaría)
          </h2>
          <p className="text-sm text-gray-500">
            Gestión de reservas, atención y reprogramaciones.
          </p>
        </div>
        <button
          className="bg-bautista-red text-white font-bold px-5 py-3 rounded-2xl"
          onClick={() => setManual(true)}
        >
          Registrar Cita Manual
        </button>
      </div>
      <RequestState
        loading={summary.loading}
        error={summary.error}
        onRetry={summary.reload}
      />
      {summary.response && <KpiCards summary={summary.response.data} />}
      <RequestState
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
      />
      <AppointmentsTable
        appointments={appointments}
        filters={filters}
        setFilters={setFilters}
        pagination={list.response?.pagination}
        onEditAppointment={setSelected}
        onChangeStatus={change}
        busy={busy || list.loading}
      />
      <ManualBookingModal isOpen={manual} onClose={() => setManual(false)} />
      <EditBookingModal
        isOpen={!!selected}
        appointment={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
