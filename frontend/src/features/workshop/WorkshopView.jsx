import React, { useState } from 'react';
import { useAgenda } from '../../context/AgendaContext';
import KanbanBoard from './KanbanBoard';
import EditBookingModal from '../appointments/EditBookingModal';

export default function WorkshopView() {
  const { appointments, changeKanbanStep } = useAgenda();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Encabezado de la Vista */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Control Operativo de Taller (Kanban)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Seguimiento de vehículos en recepción, diagnóstico, reparación y entrega final.
          </p>
        </div>

        <div className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
          <span>Las citas canceladas quedan excluidas del flujo de trabajo</span>
        </div>
      </div>

      {/* Tablero Kanban */}
      <KanbanBoard
        appointments={appointments}
        onMoveKanban={changeKanbanStep}
        onEditAppointment={handleEdit}
      />

      {/* Modal de Edición desde el Tablero */}
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
