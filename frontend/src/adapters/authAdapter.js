/**
 * Adaptador y control de acceso basado en roles (RBAC).
 * 
 * NOTA DE SEGURIDAD:
 * La protección de rutas y pestañas en el frontend es para experiencia de usuario.
 * La autorización y permisos efectivos deben ser validados por el backend en cada petición.
 */

export const ROLES = {
  ADMIN: 'admin',
  SECRETARIA: 'secretaria',
  JEFE: 'jefe',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administración / Gerencia',
  [ROLES.SECRETARIA]: 'Secretaría',
  [ROLES.JEFE]: 'Jefe de Taller',
};

/**
 * Determina si un rol de usuario tiene permitido visualizar una vista interna determinada.
 * - admin y secretaria: pueden alternar entre Secretaría, Jefe de Taller y Administración.
 * - jefe: acceso restringido ÚNICAMENTE a Jefe de Taller.
 * 
 * @param {string} userRole - Rol autenticado ('admin' | 'secretaria' | 'jefe')
 * @param {string} targetView - Vista objetivo ('secretaria' | 'jefe' | 'admin')
 * @returns {boolean}
 */
export function canAccessView(userRole, targetView) {
  if (!userRole) return false;
  if (userRole === ROLES.ADMIN || userRole === ROLES.SECRETARIA) {
    return true; // Acceso a las tres vistas
  }
  if (userRole === ROLES.JEFE) {
    return targetView === ROLES.JEFE; // Restringido solo a jefe
  }
  return false;
}
