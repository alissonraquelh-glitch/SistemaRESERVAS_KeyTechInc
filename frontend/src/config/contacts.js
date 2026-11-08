/**
 * Configuración de contactos y canales públicos de Taller Bautista.
 * NOTA DE MIGRACIÓN:
 * El prototipo V6 mostraba en el footer el número '+503 7873 0667' pero en el código JS
 * de redirección a WhatsApp usaba '50372948461'. Se centraliza aquí con el número público
 * oficial del footer por defecto y se documenta la necesidad de confirmación del responsable.
 */

export const CONTACTS_CONFIG = {
  // Número WhatsApp para enlace wa.me (sin signos '+' ni espacios para la URL)
  whatsAppNumber: '50378730667',
  whatsAppDisplay: '+503 7873 0667',
  whatsAppTestNumber: '50372948461', // Número de pruebas detectado en el JS original
  
  phoneDisplay: '+503 7873 0667',
  phoneCall: '+50378730667',
  
  address: 'Carretera Panamericana Km 138, San Miguel, El Salvador',
  googleMapsUrl: 'https://maps.google.com/?q=San+Miguel+El+Salvador+Taller+Bautista',
  
  companyName: 'GRUPO BAUTISTA',
  tagline: 'Servicios Automotrices',
  branchName: 'Taller Central San Miguel',
};
