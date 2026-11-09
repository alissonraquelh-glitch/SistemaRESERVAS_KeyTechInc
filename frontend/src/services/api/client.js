const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
let csrfToken = "";
export const setCsrfToken = (value) => {
  csrfToken = value || "";
};
export class ApiError extends Error {
  constructor(message, status = 500, code = "API_ERROR", fields = null) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}
export async function apiRequest(route, options = {}) {
  if (!route?.path || route.status !== "CONFIRMED")
    throw new ApiError(
      "Operación no configurada.",
      501,
      "ENDPOINT_NOT_CONFIGURED",
    );
  const params = options.pathParams || {};
  const path = route.path.replace(/:([a-z_]+)/gi, (_, key) => {
    if (params[key] == null)
      throw new ApiError("Falta el identificador.", 400, "INVALID_PATH");
    return encodeURIComponent(params[key]);
  });
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.queryParams || {}))
    if (value !== undefined && value !== null && value !== "")
      query.set(key, String(value));
  const url = BASE_URL + path + (query.size ? "?" + query : "");
  const mutation = !["GET", "HEAD"].includes(route.method);
  let response;
  try {
    response = await fetch(url, {
      method: route.method,
      credentials: "same-origin",
      signal: options.signal,
      headers: {
        Accept: "application/json",
        ...(mutation
          ? { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
          : {}),
        ...options.headers,
      },
      ...(mutation ? { body: JSON.stringify(options.body || {}) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "No se pudo conectar con el servidor.",
      0,
      "NETWORK_ERROR",
    );
  }
  const text = await response.text();
  let result;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(
      "El servidor devolvió una respuesta no válida.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
  if (!response.ok) {
    if (response.status === 401 && route.path !== "/auth/login")
      window.dispatchEvent(new Event("bookit:unauthorized"));
    throw new ApiError(
      result?.message || "La operación no pudo completarse.",
      response.status,
      result?.code,
      result?.fields,
    );
  }
  return result;
}
