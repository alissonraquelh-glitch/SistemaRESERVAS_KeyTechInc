import { Appointment } from './Appointment'

/**
 * Clase BookingManager
 * ---------------------
 * Administra las solicitudes de cita que el cliente va enviando desde
 * el formulario. Centraliza la regla de negocio "¿cómo se crea una
 * solicitud?" en un solo lugar, en vez de que el componente de React
 * arme el objeto Appointment directamente.
 *
 * En este front-end de cliente no mostramos una lista de "mis citas"
 * (no hay inicio de sesión), pero el manager sigue siendo útil: guarda
 * el historial en memoria y nos da la última solicitud para mostrar la
 * pantalla de confirmación.
 */
export class BookingManager {
  constructor() {
    this.appointments = []
  }

  addAppointment({ date, timePreference, client }) {
    const appointment = new Appointment({ date, timePreference, client })
    this.appointments.push(appointment)
    return appointment
  }

  getLast() {
    return this.appointments[this.appointments.length - 1] ?? null
  }
}
