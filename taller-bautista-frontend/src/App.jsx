import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import BookAppointment from './pages/BookAppointment'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

/**
 * Mapa de rutas de toda la app. <Layout> es la ruta "padre": pinta el
 * header y la barra inferior una sola vez, y <Outlet> dentro de él
 * (ver Layout.jsx) va cambiando el contenido según la ruta hija activa.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/servicios" element={<Services />} />
        <Route path="/agenda" element={<BookAppointment />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
