import { CheckIcon } from './Icons'

/**
 * Indicador visual de los "Pasos para agendar" que pidió Ali,
 * convertido en un stepper interactivo: resalta en qué paso va el
 * cliente y marca con un check los pasos ya completados.
 */
export default function StepIndicator({ steps, currentStep }) {
  return (
    <ol className="step-indicator">
      {steps.map((label, i) => {
        const stepNumber = i + 1
        const done = stepNumber < currentStep
        const active = stepNumber === currentStep
        return (
          <li
            key={label}
            className={
              'step-indicator__item' +
              (done ? ' step-indicator__item--done' : '') +
              (active ? ' step-indicator__item--active' : '')
            }
          >
            <span className="step-indicator__circle">
              {done ? <CheckIcon /> : stepNumber}
            </span>
            <span className="step-indicator__label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
