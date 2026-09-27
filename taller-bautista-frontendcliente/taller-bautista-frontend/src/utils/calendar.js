/**
 * Genera la matriz de semanas para pintar un calendario mensual tipo
 * grid (Domingo a Sábado). Cada celda es un objeto Date, o null
 * cuando la celda pertenece al mes anterior/siguiente y solo se deja
 * como espacio en blanco.
 *
 * Separar esto en una función propia (en vez de escribirlo dentro del
 * componente) permite probarlo y reutilizarlo sin depender de React.
 */
export function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay() // 0 = domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

export const WEEKDAY_LABELS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

export const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isPast(date, today = new Date()) {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return date < startOfToday
}
