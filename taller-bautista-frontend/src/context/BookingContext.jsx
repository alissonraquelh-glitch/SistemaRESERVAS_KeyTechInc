import { createContext, useContext, useRef, useState, useCallback } from 'react'
import { BookingManager } from '../models/BookingManager'

const BookingContext = createContext(null)

/**
 * Puente entre la clase BookingManager (lógica pura de POO, sin nada
 * de React) y los componentes de React (que necesitan "state" para
 * volver a pintarse cuando algo cambia).
 *
 * La instancia de BookingManager vive en un useRef: se crea UNA sola
 * vez y no se pierde entre renders. Cuando se agrega una solicitud,
 * guardamos la última en un useState para que la pantalla de
 * confirmación de Agenda pueda mostrarla.
 */
export function BookingProvider({ children }) {
  const managerRef = useRef(null)
  if (managerRef.current === null) {
    managerRef.current = new BookingManager()
  }

  const [lastAppointment, setLastAppointment] = useState(null)

  const addAppointment = useCallback((data) => {
    const appointment = managerRef.current.addAppointment(data)
    setLastAppointment(appointment)
    return appointment
  }, [])

  return (
    <BookingContext.Provider value={{ lastAppointment, addAppointment }}>
      {children}
    </BookingContext.Provider>
  )
}

/** Hook para que cualquier página consuma el contexto sin repetir useContext. */
export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking debe usarse dentro de <BookingProvider>')
  return ctx
}
