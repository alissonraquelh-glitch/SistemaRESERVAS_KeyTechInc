import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpg'
import { serviceCategories } from '../data/serviceCategories'
import CategoryCard from '../components/CategoryCard'
import SloganRotator from '../components/SloganRotator'
import { ScanIcon } from '../components/Icons'

/**
 * Home ya no es un catálogo de servicios con precio: el objetivo de
 * esta pantalla es UNO SOLO, llevar al cliente a agendar su cita para
 * el diagnóstico con el escáner computarizado. Las categorías de abajo
 * son solo para que sepa qué áreas cubre el taller.
 */
export default function Home() {
  return (
    <div className="page home">
      <section className="hero">
        <img src={logo} alt="Grupo Bautista" className="hero__logo" />
        <SloganRotator />
        <h1 className="hero__title">Agenda tu diagnóstico con Scanner Computarizado</h1>
        <p className="hero__subtitle">
          Nuestro equipo revisa tu vehículo con equipo de diagnóstico computarizado y te
          recomienda exactamente lo que necesita, sin adivinar.
        </p>
        <Link to="/agenda" className="btn btn--cta">
          <ScanIcon /> Reservar Cita
        </Link>
      </section>

      <section>
        <h2 className="section-title">¿Qué revisamos?</h2>
        <p className="section-subtitle">
          Toca cada área para ver qué incluye. El diagnóstico determina qué necesita tu auto.
        </p>
        <div className="category-list">
          {serviceCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <h2>¿Listo para saber qué necesita tu auto?</h2>
        <Link to="/agenda" className="btn btn--cta">
          <ScanIcon /> Agendar Cita
        </Link>
      </section>
    </div>
  )
}
