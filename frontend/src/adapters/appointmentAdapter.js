/**
 * Adaptador de Citas (Frontend UI <-> Backend Contract).
 * 
 * NOTAS DE MAPEO:
 * 1. Base de datos actual (PostgreSQL DataBase.sql) solo define estado_cita:
 *    ('PENDIENTE', 'COMPLETADA', 'CANCELADA'), mientras que el prototipo V6 requiere
 *    ('PENDIENTE', 'EN_TALLER', 'COMPLETADO', 'CANCELADO') y 4 etapas Kanban.
 * 2. El modelo vehiculo de la DB separa marca, modelo y tipo (GENERAL/PESADO).
 *    El prototipo capturaba marca y modelo juntos y hacía `split(' ')[0]`, lo que rompía
 *    marcas compuestas (ej: "Alfa Romeo", "Mercedes Benz"). Este adaptador preserva ambos textos.
 * 3. documento_identidad se maneja como string para admitir tanto DUI como NIT.
 */

/**
 * @typedef {Object} UIAppointment
 * @property {string} id - Folio comercial (ej: "BK-901")
 * @property {string} clientName - Nombre del cliente
 * @property {string} dui - Documento de identidad (DUI o NIT)
 * @property {string} phone - Teléfono de contacto
 * @property {string} placa - Matrícula del vehículo
 * @property {('GENERAL'|'PESADO')} vehType - Tipo de vehículo
 * @property {string} vehBrand - Marca del vehículo
 * @property {string} vehModel - Modelo completo del vehículo
 * @property {string} service - Servicio solicitado
 * @property {string} comments - Comentarios o notas adicionales
 * @property {string} date - Fecha civil YYYY-MM-DD
 * @property {string} timeSlot - Intervalo horario (ej: "08:00 - 10:00")
 * @property {('PENDIENTE'|'EN_TALLER'|'COMPLETADO'|'CANCELADO')} status - Estado operativo
 * @property {(1|2|3|4)} kanbanStep - Etapa operativa del taller
 * @property {string} createdAt - Fecha de creación
 */

/**
 * Normaliza un registro de cita que provenga de la API o del estado inicial hacia el modelo UI.
 * @param {object} raw 
 * @returns {UIAppointment}
 */
export function toUIAppointment(raw) {
  if (!raw) return null;

  // Extraer marca y modelo con seguridad si vienen juntos o separados
  let vehBrand = raw.vehBrand || raw.marca || '';
  let vehModel = raw.vehModel || raw.modelo || '';
  if (!vehBrand && vehModel) {
    vehBrand = vehModel.split(' ')[0] || 'Marca';
  } else if (!vehModel && vehBrand) {
    vehModel = vehBrand;
  }

  // Mapeo seguro de estados (Postgres COMPLETADA -> UI COMPLETADO)
  let status = raw.status || raw.estado || 'PENDIENTE';
  if (status === 'COMPLETADA') status = 'COMPLETADO';
  if (status === 'CANCELADA') status = 'CANCELADO';

  // Determinación de etapa Kanban (1..4)
  let kanbanStep = Number(raw.kanbanStep || raw.etapa_kanban || 1);
  if (!raw.kanbanStep) {
    if (status === 'PENDIENTE') kanbanStep = 1;
    else if (status === 'EN_TALLER') kanbanStep = 2;
    else if (status === 'COMPLETADO') kanbanStep = 4;
  }

  return {
    id: raw.id || raw.folio || raw.id_cita || `BK-${Math.floor(100 + Math.random() * 900)}`,
    clientName: raw.clientName || raw.nombre_completo || raw.nombre || 'Cliente',
    dui: raw.dui || raw.documento_identidad || '',
    phone: raw.phone || raw.telefono || '',
    placa: (raw.placa || '').toUpperCase(),
    vehType: raw.vehType || raw.tipo || 'GENERAL',
    vehBrand: vehBrand || 'Vehículo',
    vehModel: vehModel || 'Vehículo',
    service: raw.service || raw.servicio_solicitado || 'Mantenimiento General',
    comments: raw.comments || raw.notas || 'Sin comentarios',
    date: raw.date || (raw.inicio ? raw.inicio.slice(0, 10) : ''),
    timeSlot: raw.timeSlot || raw.intervalo || '08:00 - 10:00',
    status,
    kanbanStep,
    createdAt: raw.createdAt || raw.creada_en || new Date().toLocaleString(),
  };
}

/**
 * Convierte el modelo de la UI a la propuesta de payload requerida para backend.
 * TODO: Acordar con el equipo de backend el payload definitivo para la operación transaccional.
 * @param {Partial<UIAppointment>} ui
 * @returns {object} Propuesta de payload para backend
 */
export function toBackendAppointmentPayload(ui) {
  return {
    cliente: {
      nombre_completo: ui.clientName,
      telefono: ui.phone,
      documento_identidad: ui.dui,
    },
    vehiculo: {
      placa: ui.placa?.toUpperCase(),
      tipo: ui.vehType || 'GENERAL',
      marca: ui.vehBrand,
      modelo: ui.vehModel,
    },
    cita: {
      fecha: ui.date,
      intervalo: ui.timeSlot,
      servicio_solicitado: ui.service,
      notas: ui.comments,
      origen: 'TELEFONO', // Registro manual por secretaría
    },
  };
}
