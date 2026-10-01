/**
 * Clase Appointment (solicitud de cita)
 * ---------------------------------------
 * Ya no se agenda una hora exacta desde esta página: este front-end es
 * SOLO para clientes. El cliente elige un día y si prefiere mañana o
 * tarde; el equipo del taller confirma la hora exacta por correo desde
 * el panel de administración (fuera de este proyecto).
 *
 * Por eso Appointment ya no guarda una hora ("10:00 AM"), sino una
 * preferencia de franja horaria, y los datos del cliente que pidió el
 * formulario (DUI, vehículo, placa, correo, teléfono).
 */
export const TIME_PREFERENCE = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
}

let nextId = 1

export class Appointment {
  constructor({ date, timePreference, client }) {
    this.id = nextId++
    this.date = date // objeto Date
    this.timePreference = timePreference // 'Mañana' | 'Tarde'
    this.client = client // { name, dui, brand, model, year, plate, email, phone }
    this.status = 'Pendiente de confirmación'
    this.createdAt = new Date()
  }

  /** Fecha en formato amigable, ej. "lunes, 6 de octubre de 2026". */
  getFormattedDate() {
    return this.date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  /** Descripción corta del vehículo, ej. "Toyota Corolla 2018". */
  getVehicleLabel() {
    return `${this.client.brand} ${this.client.model} ${this.client.year}`.trim()
  }
}
