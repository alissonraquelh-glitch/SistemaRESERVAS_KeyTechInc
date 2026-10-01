import { ServiceCategory } from '../models/ServiceCategory'

/**
 * Las 4 áreas de trabajo del taller, tal como las definió Ali en las
 * especificaciones. Ya NO tienen precio: son solo informativas, para
 * que el cliente sepa qué cubre el taller antes de agendar su cita
 * de diagnóstico con el escáner computarizado.
 */
export const serviceCategories = [
  new ServiceCategory({
    id: 'mecanica-general',
    name: 'Mecánica General',
    icon: 'wrench',
    description: 'Mantenimiento y reparación de los sistemas mecánicos de tu vehículo.',
    items: ['Mantenimiento general', 'Sistema de frenos', 'Cuerpo de aceleración'],
    image:
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop',
  }),
  new ServiceCategory({
    id: 'electrico',
    name: 'Eléctrico',
    icon: 'bolt',
    description: 'Diagnóstico y reparación del sistema eléctrico y electrónico.',
    items: ['Sensores', 'Computadoras', 'Luces'],
    image:
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=800&auto=format&fit=crop',
  }),
  new ServiceCategory({
    id: 'aire-acondicionado',
    name: 'A/C',
    icon: 'snowflake',
    description: 'Revisión y reparación del sistema de aire acondicionado.',
    items: ['Diagnóstico de A/C', 'Carga de gas refrigerante', 'Reparación de componentes'],
    image:
      'https://images.unsplash.com/photo-1620032201013-25e67ba98d97?q=80&w=800&auto=format&fit=crop',
  }),
  new ServiceCategory({
    id: 'alineado-balanceo',
    name: 'Alineado y Balanceo',
    icon: 'wheel',
    description: 'Alineación, balanceo y otros servicios varios para tu vehículo.',
    items: ['Alineado', 'Balanceo', 'Servicios varios'],
    image:
      'https://images.unsplash.com/photo-1600661653561-629509216228?q=80&w=800&auto=format&fit=crop',
  }),
]
