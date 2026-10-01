import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'
import Footer from './Footer'

/**
 * "Cascarón" visual que envuelve TODAS las páginas: encabezado arriba,
 * el contenido de la página activa en medio (<Outlet />, lo inyecta
 * React Router según la ruta), el pie de página con redes sociales, y
 * la barra inferior (solo visible en móvil) al fondo.
 */
export default function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Outlet />
        <Footer />
      </main>
      <BottomNav />
    </div>
  )
}
