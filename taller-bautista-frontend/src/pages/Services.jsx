import { Link } from 'react-router-dom'
import { serviceCategories } from '../data/serviceCategories'
import CategoryCard from '../components/CategoryCard'
import { ScanIcon } from '../components/Icons'

/** Página "Servicios": las áreas que cubre el taller, sin precios ni catálogo individual. */
export default function Services() {
  return (
    <div className="page">
      <h1 className="page__title">Nuestros Servicios</h1>
      <p className="page__subtitle">
        No elegimos el servicio por ti: agenda tu cita de diagnóstico y nuestro equipo te dirá
        exactamente qué necesita tu vehículo entre estas áreas.
      </p>

      <div className="category-list">
        {serviceCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      <Link to="/agenda" className="btn btn--cta btn--block">
        <ScanIcon /> Agendar Cita
      </Link>
    </div>
  )
}
