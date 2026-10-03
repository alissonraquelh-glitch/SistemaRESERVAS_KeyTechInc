import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración de Vite: solo necesitamos el plugin de React para
// que entienda archivos .jsx y active el "fast refresh" en desarrollo.
export default defineConfig({
  plugins: [react()],
})
