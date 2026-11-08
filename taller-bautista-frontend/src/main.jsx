import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { BookingProvider } from './context/BookingContext.jsx'
import './index.css'

// Punto de entrada de toda la app. El orden de los "envoltorios"
// importa: BrowserRouter habilita la navegación por URL, y
// BookingProvider pone a disposición de cualquier página el estado
// de las citas (ver src/context/BookingContext.jsx).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <BookingProvider>
        <App />
      </BookingProvider>
    </BrowserRouter>
  </StrictMode>
)
