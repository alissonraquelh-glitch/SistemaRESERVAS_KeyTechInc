import { contactInfo } from '../data/branchesData'
import { PhoneIcon, InstagramIcon, FacebookIcon } from './Icons'

/**
 * Pie de página visible en todas las pantallas (se agrega una sola vez
 * en Layout.jsx). Cumple el pedido de "dejar un apartado para redes
 * sociales" en todo el sitio, no solo en la página de Contacto.
 */
export default function Footer() {
  return (
    <footer className="site-footer">
      <p className="site-footer__slogan">Grupo Bautista · Más de 45 años de calidad</p>
      <div className="site-footer__links">
        <a href={`tel:${contactInfo.phone}`}>
          <PhoneIcon /> {contactInfo.phone}
        </a>
        <a href={contactInfo.instagram} target="_blank" rel="noreferrer">
          <InstagramIcon /> Instagram
        </a>
        <a href={contactInfo.facebook} target="_blank" rel="noreferrer">
          <FacebookIcon /> Facebook
        </a>
      </div>
    </footer>
  )
}
