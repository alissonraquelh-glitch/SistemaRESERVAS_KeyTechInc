const STATUS = {
  PENDIENTE: "PENDIENTE",
  EN_DIAGNOSTICO: "EN_TALLER",
  EN_REPARACION: "EN_TALLER",
  COMPLETADA: "COMPLETADO",
  CANCELADA: "CANCELADO",
};
const STEP = {
  PENDIENTE: 1,
  EN_DIAGNOSTICO: 2,
  EN_REPARACION: 3,
  COMPLETADA: 4,
};
export function toUIAppointment(raw, services = []) {
  return {
    id: raw.id_cita,
    clientName: raw.nombre_completo,
    dui: raw.documento_identidad,
    phone: raw.telefono,
    email: raw.correo,
    placa: raw.placa,
    vehType: raw.tipo,
    vehBrand: raw.marca || "",
    vehModel: raw.modelo || "",
    serviceCode: raw.servicio_codigo,
    service:
      services.find((s) => s.codigo === raw.servicio_codigo)?.nombre ||
      raw.servicio_codigo,
    comments: raw.notas || "",
    date: raw.inicio.slice(0, 10),
    timeSlot: raw.inicio.slice(11, 16) + " - " + raw.fin.slice(11, 16),
    status: STATUS[raw.estado],
    detailedStatus: raw.estado,
    kanbanStep: STEP[raw.estado] || null,
    createdAt: raw.creado_en,
  };
}
export function toBackendAppointmentPayload(ui) {
  const [start, end] = ui.timeSlot.split(" - ");
  return {
    cliente: {
      nombre_completo: ui.clientName,
      telefono: ui.phone,
      documento_identidad: ui.dui,
    },
    vehiculo: {
      placa: ui.placa,
      marca: ui.vehBrand,
      modelo: ui.vehModel,
      tipo: ui.vehType,
    },
    cita: {
      inicio: ui.date + " " + start + ":00",
      fin: ui.date + " " + end + ":00",
      servicio_codigo: ui.serviceCode,
      notas: ui.comments || null,
    },
  };
}
