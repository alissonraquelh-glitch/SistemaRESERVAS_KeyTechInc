import React, { useState } from 'react';
import { useAgenda } from '../../context/AgendaContext';
import KpiCards from './KpiCards';
import AppointmentsTable from './AppointmentsTable';
import ManualBookingModal from './ManualBookingModal';
import EditBookingModal from './EditBookingModal';

export default function SecretaryView() {
  const { appointments, changeAppointmentStatus } = useAgenda();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Recepción y Control de Citas (Secretaría)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestión integral de reservas, atención telefónica, cambios de estado y reprogramaciones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsManualModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-bautista-red hover:bg-bautista-darkRed text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5 shrink-0"
        >
          <i className="fa-solid fa-plus-circle text-base"></i>
          <span>Registrar Cita Manual</span>
        </button>
      </div>

      {/* Tarjetas KPI */}
      <KpiCards appointments={appointments} />

      {/* Tabla Dinámica con Filtros */}
      <AppointmentsTable
        appointments={appointments}
        onEditAppointment={handleEdit}
        onChangeStatus={changeAppointmentStatus}
      />

      {/* Modal de Alta Manual */}
      <ManualBookingModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      {/* Modal de Edición */}
      <EditBookingModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />
    </div>
  );
}
