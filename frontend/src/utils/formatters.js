/**
 * Formateadores y validadores de campos de entrada para El Salvador.
 */

/**
 * Formatea una cadena de teléfono al formato local 0000-0000.
 * @param {string} val 
 * @returns {string}
 */
export function formatPhone(val) {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
  }
  return digits;
}

/**
 * Formatea una cadena de DUI al formato 00000000-0.
 * @param {string} val 
 * @returns {string}
 */
export function formatDui(val) {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 9);
  if (digits.length > 8) {
    return `${digits.slice(0, 8)}-${digits.slice(8, 9)}`;
  }
  return digits;
}

/**
 * Valida nombre: solo letras y espacios.
 * @param {string} name 
 * @returns {boolean}
 */
export function validateName(name) {
  if (!name) return false;
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return nameRegex.test(name.trim());
}

/**
 * Valida teléfono salvadoreño: al menos 8 dígitos.
 * @param {string} phone 
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8;
}

/**
 * Valida correo electrónico con formato estándar (no restrictivo artificial a .com).
 * @param {string} email 
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Construye la URL de WhatsApp con mensaje codificado.
 * Regla de negocio: Abrir WhatsApp NO crea cliente ni aparta cupo en la base de datos.
 * 
 * @param {string} whatsAppNumber - Número en formato internacional sin '+' (ej: '50378730667')
 * @param {string} message - Texto del mensaje a enviar
 * @returns {string} Enlace https://wa.me/...
 */
export function buildWhatsAppLink(whatsAppNumber, message) {
  const cleanNumber = (whatsAppNumber || '').replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message || '');
  return `https://wa.me/${cleanNumber}?text=${encodedMsg}`;
}
