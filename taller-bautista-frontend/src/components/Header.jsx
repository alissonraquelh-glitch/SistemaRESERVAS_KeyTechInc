import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.jpg'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/contacto', label: 'Contacto' },
]

/**
 * Encabezado superior. En escritorio funciona como el menú principal
 * del sitio (logo + enlaces). En móvil se reduce a solo el logo,
 * porque en pantallas pequeñas la navegación vive en <BottomNav />
 * (igual que en la maqueta original de Ali).
 */
export default function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <NavLink to="/" className="header__brand">
          <img src={logo} alt="Grupo Bautista" className="header__logo" />
        </NavLink>

        <nav className="header__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                'header__link' + (isActive ? ' header__link--active' : '')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
