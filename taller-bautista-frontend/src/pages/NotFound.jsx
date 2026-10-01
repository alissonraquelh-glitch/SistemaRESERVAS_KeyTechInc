import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page">
      <h1 className="page__title">Página no encontrada</h1>
      <Link to="/">Volver al inicio</Link>
    </div>
  )
}
