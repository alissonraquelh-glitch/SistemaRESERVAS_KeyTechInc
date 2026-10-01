import { useState } from 'react'
import { CATEGORY_ICONS, ChevronDownIcon } from './Icons'

/**
 * Tarjeta de categoría de servicio, sin precio. Es un "acordeón": al
 * darle clic se expande para mostrar qué incluye esa categoría. Esto
 * reemplaza a las antiguas tarjetas de servicio individuales (que sí
 * tenían precio y llevaban a una página de detalle propia).
 */
export default function CategoryCard({ category }) {
  const [open, setOpen] = useState(false)
  const Icon = CATEGORY_ICONS[category.icon] ?? CATEGORY_ICONS.wrench

  return (
    <div className={'category-card' + (open ? ' category-card--open' : '')}>
      <button
        className="category-card__header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="category-card__icon">
          <Icon />
        </span>
        <span className="category-card__title">
          <span className="category-card__name">{category.name}</span>
          <span className="category-card__desc">{category.description}</span>
        </span>
        <span className="category-card__chevron">
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div className="category-card__body">
          <ul>
            {category.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
