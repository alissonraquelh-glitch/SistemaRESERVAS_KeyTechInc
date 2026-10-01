import { useEffect, useState } from 'react'

const DEFAULT_SLOGANS = [
  'Más de 45 años de calidad',
  'Mecánicos certificados',
  'Garantía en todos los trabajos',
  'Diagnóstico computarizado de precisión',
]

/**
 * Pequeño detalle "interactivo" para el Home: un slogan que va
 * cambiando solo cada pocos segundos, con una transición suave.
 * Usa useEffect + setInterval, y limpia el intervalo al desmontar
 * (regla básica de React para evitar fugas de memoria).
 */
export default function SloganRotator({ slogans = DEFAULT_SLOGANS }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slogans.length)
    }, 3200)
    return () => clearInterval(id)
  }, [slogans.length])

  return (
    <p className="slogan-rotator" key={index}>
      {slogans[index]}
    </p>
  )
}
