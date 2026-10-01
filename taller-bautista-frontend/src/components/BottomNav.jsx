import { NavLink } from 'react-router-dom'
import { HomeIcon, WrenchIcon, CalendarIcon, PhoneIcon } from './Icons'

const items = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/servicios', label: 'Servicios', Icon: WrenchIcon },
  { to: '/agenda', label: 'Agenda', Icon: CalendarIcon },
  { to: '/contacto', label: 'Contacto', Icon: PhoneIcon },
]

/**
 * Barra de navegación inferior, visible solo en móvil (ver
 * .bottom-nav en index.css, que la oculta con media query en
 * pantallas grandes). Replica la barra de la maqueta original,
 * pero funcional: NavLink resalta automáticamente el ítem activo
 * según la ruta actual.
 */
export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            'bottom-nav__item' + (isActive ? ' bottom-nav__item--active' : '')
          }
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
