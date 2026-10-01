/**
 * Clase ServiceCategory
 * ----------------------
 * Grupo Bautista ya no deja que el cliente elija y "compre" un servicio
 * específico desde la web (eso lo decide el taller después de revisar
 * el auto con el escáner computarizado). Por eso ya no existe una
 * clase "Service" con precio: en su lugar, ServiceCategory representa
 * un ÁREA de trabajo del taller (ej. "Eléctrico"), solo para que el
 * cliente entienda qué cubre el taller antes de agendar su cita.
 *
 * Sigue el mismo principio de encapsulamiento que antes: cada
 * categoría sabe describirse a sí misma (getItemsLabel), sin precio
 * ni lógica de compra.
 */
export class ServiceCategory {
  constructor({ id, name, icon, description, items = [], image }) {
    this.id = id
    this.name = name
    this.icon = icon
    this.description = description
    this.items = items
    this.image = image
  }

  /** Texto tipo "Mantenimiento general, Sistema de frenos, ..." */
  getItemsLabel() {
    return this.items.join(', ')
  }
}
