import { useMemo, useState } from 'react'
import { useBooking } from '../context/BookingContext'
import { TIME_PREFERENCE } from '../models/Appointment'
import StepIndicator from '../components/StepIndicator'
import { ScanIcon } from '../components/Icons'
import {
  getMonthMatrix,
  WEEKDAY_LABELS,
  MONTH_LABELS,
  isSameDay,
  isPast,
} from '../utils/calendar'

const STEPS = ['Selecciona el día', 'Disponibilidad', 'Tus datos', 'Confirmación']

const EMPTY_CLIENT = {
  name: '',
  dui: '',
  brand: '',
  model: '',
  year: '',
  plate: '',
  email: '',
  phone: '',
}

/**
 * Agenda como "wizard" de 4 pasos, siguiendo exactamente los pasos que
 * pidió Ali: elegir día → ver disponibilidad (mañana/tarde, sin hora
 * exacta) → llenar formulario → esperar correo de confirmación. La
 * hora exacta la confirma el taller después, desde su propio panel de
 * administración (fuera de este proyecto de front-end de cliente).
 */
export default function BookAppointment() {
  const { addAppointment } = useBooking()

  const [step, setStep] = useState(1)
  const today = useMemo(() => new Date(), [])
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectedDate, setSelectedDate] = useState(null)
  const [timePreference, setTimePreference] = useState(null)
  const [client, setClient] = useState(EMPTY_CLIENT)
  const [confirmedAppointment, setConfirmedAppointment] = useState(null)

  const weeks = useMemo(
    () => getMonthMatrix(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth]
  )

  const changeMonth = (delta) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  const updateClient = (field) => (e) => {
    setClient((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const isClientComplete = Object.values(client).every((value) => value.trim() !== '')

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length))
  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isClientComplete) return
    const appointment = addAppointment({ date: selectedDate, timePreference, client })
    setConfirmedAppointment(appointment)
    setStep(4)
  }

  const startOver = () => {
    setSelectedDate(null)
    setTimePreference(null)
    setClient(EMPTY_CLIENT)
    setConfirmedAppointment(null)
    setStep(1)
  }

  return (
    <div className="page">
      <h1 className="page__title">Agendar Cita</h1>
      <p className="page__subtitle">
        Este espacio es para clientes. Nuestro equipo confirmará por correo la hora exacta en
        que puedes traer tu vehículo.
      </p>

      <StepIndicator steps={STEPS} currentStep={step} />

      {step === 1 && (
        <div className="wizard-step">
          <h2>Selecciona el día que deseas llevar tu vehículo</h2>
          <div className="calendar">
            <div className="calendar__header">
              <button aria-label="Mes anterior" onClick={() => changeMonth(-1)}>
                ‹
              </button>
              <h3>
                {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </h3>
              <button aria-label="Mes siguiente" onClick={() => changeMonth(1)}>
                ›
              </button>
            </div>

            <div className="calendar__weekdays">
              {WEEKDAY_LABELS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div className="calendar__week" key={wi}>
                {week.map((date, di) => {
                  if (!date)
                    return <span key={di} className="calendar__cell calendar__cell--empty" />
                  const past = isPast(date, today)
                  const selected = isSameDay(date, selectedDate)
                  return (
                    <button
                      key={di}
                      disabled={past}
                      onClick={() => setSelectedDate(date)}
                      className={
                        'calendar__cell' +
                        (selected ? ' calendar__cell--selected' : '') +
                        (past ? ' calendar__cell--disabled' : ' calendar__cell--available')
                      }
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <button className="btn btn--primary btn--block" disabled={!selectedDate} onClick={goNext}>
            Siguiente
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <h2>Disponibilidad del taller</h2>
          <p className="page__subtitle">
            Elige si prefieres traer tu vehículo en la mañana o en la tarde. Confirmaremos la
            hora exacta disponible ese día por correo.
          </p>
          <div className="time-pref-grid">
            {Object.values(TIME_PREFERENCE).map((pref) => (
              <button
                key={pref}
                className={
                  'time-pref-card' + (timePreference === pref ? ' time-pref-card--active' : '')
                }
                onClick={() => setTimePreference(pref)}
              >
                <span className="time-pref-card__title">{pref}</span>
                <span className="time-pref-card__hours">
                  {pref === TIME_PREFERENCE.MORNING ? '8:00 AM – 12:00 PM' : '1:00 PM – 5:00 PM'}
                </span>
              </button>
            ))}
          </div>

          <div className="wizard-actions">
            <button className="btn btn--outline" onClick={goBack}>
              Atrás
            </button>
            <button className="btn btn--primary" disabled={!timePreference} onClick={goNext}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form className="wizard-step" onSubmit={handleSubmit}>
          <h2>Tus datos</h2>
          <div className="form-grid">
            <label className="field">
              <span>Nombre completo</span>
              <input value={client.name} onChange={updateClient('name')} required />
            </label>
            <label className="field">
              <span>DUI</span>
              <input value={client.dui} onChange={updateClient('dui')} required />
            </label>
            <label className="field">
              <span>Marca del vehículo</span>
              <input value={client.brand} onChange={updateClient('brand')} required />
            </label>
            <label className="field">
              <span>Modelo</span>
              <input value={client.model} onChange={updateClient('model')} required />
            </label>
            <label className="field">
              <span>Año</span>
              <input value={client.year} onChange={updateClient('year')} required />
            </label>
            <label className="field">
              <span>Placa</span>
              <input value={client.plate} onChange={updateClient('plate')} required />
            </label>
            <label className="field">
              <span>Correo</span>
              <input type="email" value={client.email} onChange={updateClient('email')} required />
            </label>
            <label className="field">
              <span>Teléfono</span>
              <input value={client.phone} onChange={updateClient('phone')} required />
            </label>
          </div>

          <div className="wizard-actions">
            <button type="button" className="btn btn--outline" onClick={goBack}>
              Atrás
            </button>
            <button type="submit" className="btn btn--cta" disabled={!isClientComplete}>
              <ScanIcon /> Reservar
            </button>
          </div>
        </form>
      )}

      {step === 4 && confirmedAppointment && (
        <div className="wizard-step confirmation">
          <div className="confirmation__icon">✓</div>
          <h2>¡Solicitud recibida!</h2>
          <p>
            Te enviaremos un correo a <strong>{confirmedAppointment.client.email}</strong> para
            confirmar la hora exacta en que puedes traer tu vehículo.
          </p>

          <div className="confirmation__summary">
            <p>
              <strong>Día:</strong> {confirmedAppointment.getFormattedDate()}
            </p>
            <p>
              <strong>Preferencia:</strong> {confirmedAppointment.timePreference}
            </p>
            <p>
              <strong>Vehículo:</strong> {confirmedAppointment.getVehicleLabel()} (placa{' '}
              {confirmedAppointment.client.plate})
            </p>
          </div>

          <button className="btn btn--primary btn--block" onClick={startOver}>
            Agendar otra cita
          </button>
        </div>
      )}
    </div>
  )
}
