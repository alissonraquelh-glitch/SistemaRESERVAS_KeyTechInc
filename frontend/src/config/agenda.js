/**
 * Configuración por defecto y catálogos de referencia de la agenda.
 * 
 * NOTA DE MIGRACIÓN:
 * - El HTML original contenía referencias a cierre a las 17:00 en textos estáticos,
 *   pero la lógica de JavaScript fijaba DEFAULT_CONFIG con cierre a las 18:00.
 *   Se usa 18:00 por defecto para permitir turnos vespertinos completos y se actualiza
 *   reactivamente según la configuración de la administración.
 */

export const DEFAULT_AGENDA_CONFIG = {
  openHour: "08:00",
  closeHour: "18:00",
  maxCapacity: 3,
  blockedDates: [
    { date: "2026-10-02", reason: "Día del Trabajador Automotriz" }
  ]
};

export const SERVICES_CATALOG = [
  { id: "SRV-MNT", name: "Mantenimiento Preventivo (Aceite y Filtros)", description: "Revisión de fluidos, filtros y puesta a punto" },
  { id: "SRV-DIAG", name: "Diagnóstico General con Escáner", description: "Lectura OBD-II y revisión electrónica computarizada" },
  { id: "SRV-FRENOS", name: "Sistema de Frenos y Suspensión", description: "Pastillas, discos, amortiguadores y terminales" },
  { id: "SRV-ALIN", name: "Alineación y Balanceo de Llantas", description: "Geometría láser y balance dinámico de ruedas" }
];

export const VEHICLE_TYPES = [
  { id: "GENERAL", label: "Vehículo Ligero / General (Sedán, SUV, Pick-up)" },
  { id: "PESADO", label: "Vehículo Pesado / Comercial (Camión, Microbús)" }
];

export const INITIAL_DEMO_APPOINTMENTS = [
  {
    id: "BK-901",
    clientName: "Josué García",
    dui: "05481923-4",
    phone: "+503 7845-1234",
    placa: "P 345-912",
    vehType: "GENERAL",
    vehBrand: "Toyota",
    vehModel: "Toyota Corolla 2021",
    service: "Mantenimiento Preventivo (Aceite y Filtros)",
    comments: "Sin comentarios",
    date: "2026-09-28",
    timeSlot: "08:00 - 10:00",
    status: "PENDIENTE",
    kanbanStep: 1,
    createdAt: "2026-09-28 08:15"
  },
  {
    id: "BK-902",
    clientName: "Alisson Mendoza",
    dui: "01823912-9",
    phone: "+503 7123-9876",
    placa: "C 812-441",
    vehType: "PESADO",
    vehBrand: "Hino",
    vehModel: "Hino 500 Series 2018",
    service: "Diagnóstico General con Escáner",
    comments: "Problemas al encender por las mañanas",
    date: "2026-09-28",
    timeSlot: "10:00 - 12:00",
    status: "EN_TALLER",
    kanbanStep: 2,
    createdAt: "2026-09-28 08:30"
  },
  {
    id: "BK-903",
    clientName: "Roberto José Henríquez",
    dui: "06129841-2",
    phone: "+503 7980-4321",
    placa: "P 901-223",
    vehType: "GENERAL",
    vehBrand: "Nissan",
    vehModel: "Nissan Frontier 2019",
    service: "Sistema de Frenos y Suspensión",
    comments: "Sin comentarios",
    date: "2026-09-28",
    timeSlot: "12:00 - 14:00",
    status: "EN_TALLER",
    kanbanStep: 3,
    createdAt: "2026-09-28 09:00"
  },
  {
    id: "BK-904",
    clientName: "Sofia Beatriz Gómez",
    dui: "02341920-5",
    phone: "+503 7555-8822",
    placa: "P 554-102",
    vehType: "GENERAL",
    vehBrand: "Hyundai",
    vehModel: "Hyundai Tucson 2022",
    service: "Alineación y Balanceo de Llantas",
    comments: "Trae repuestos en el baúl",
    date: "2026-09-29",
    timeSlot: "08:00 - 10:00",
    status: "COMPLETADO",
    kanbanStep: 4,
    createdAt: "2026-09-27 15:40"
  }
];
