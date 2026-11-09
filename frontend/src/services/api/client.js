/**
 * Cliente HTTP centralizado para Taller Bautista.
 * 
 * Reglas de calidad:
 * 1. Base URL configurable vía import.meta.env.VITE_API_BASE_URL (por defecto '/api').
 * 2. Si la ruta está marcada como 'PENDING' o no tiene path confirmado, devuelve un error
 *    controlado ENDPOINT_NOT_CONFIGURED sin realizar llamadas ficticias.
 * 3. Conserva status, message y fields ante errores HTTP 400/401/403/404/409/500/503.
 * 4. Soporta AbortSignal para cancelación de lecturas.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(message, status = 500, code = 'API_ERROR', fields = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/**
 * Realiza una petición HTTP controlada según la definición de ruta.
 * 
 * @param {object} routeDef - Objeto de API_ROUTES
 * @param {object} [options={}] - Parámetros de petición
 * @param {string} [options.pathParams] - Parámetros a sustituir o añadir a la ruta
 * @param {object} [options.queryParams] - Query string
 * @param {object} [options.body] - Payload JSON
 * @param {AbortSignal} [options.signal] - Señal de cancelación
 * @returns {Promise<any>} Respuesta deserializada
 */
export async function apiRequest(routeDef, options = {}) {
  const { pathParams = '', queryParams = null, body = null, signal = null, headers = {} } = options;

  // Si la ruta no está confirmada por el backend, abortar controladamente
  if (!routeDef || routeDef.status !== 'CONFIRMED' || !routeDef.path) {
    const errorMsg = `[Integración Pendiente] La operación '${routeDef?.description || 'Desconocida'}' no cuenta con endpoint confirmado en el backend.`;
    throw new ApiError(errorMsg, 501, 'ENDPOINT_NOT_CONFIGURED');
  }

  let finalUrl = `${BASE_URL}${routeDef.path}${pathParams}`;
  if (queryParams) {
    const search = new URLSearchParams(queryParams).toString();
    if (search) finalUrl += `?${search}`;
  }

  const fetchOptions = {
    method: routeDef.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    },
    signal,
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method)) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(finalUrl, fetchOptions);
  } catch (netErr) {
    if (netErr.name === 'AbortError') throw netErr;
    throw new ApiError(`Error de conexión al servidor: ${netErr.message}`, 0, 'NETWORK_ERROR');
  }

  let responseData = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const message = (typeof responseData === 'object' && responseData?.message)
      ? responseData.message
      : `Error HTTP ${response.status}: ${response.statusText}`;
    const fields = responseData?.fields || null;
    const code = responseData?.code || `HTTP_${response.status}`;
    
    throw new ApiError(message, response.status, code, fields);
  }

  return responseData;
}
