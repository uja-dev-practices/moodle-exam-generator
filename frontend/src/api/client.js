import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || import.meta.env.BASE_URL.replace(/\/$/, "");

const TOKEN_KEY = "genex_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Normaliza cualquier error de axios al formato de la API:
 * { code, message, status, details }.
 */
export class ApiError extends Error {
  constructor({ message, code, status, details }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Eventos para que la app reaccione a un 401 global (sesión caducada).
const listeners = new Set();
export function onUnauthorized(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new ApiError({
          message:
            "No se pudo conectar con el servidor. Comprueba que el backend está en marcha.",
          code: "network_error",
          status: 0,
        })
      );
    }

    const { status, data } = error.response;
    const apiErr = data?.error || {};

    if (status === 401) {
      listeners.forEach((fn) => fn());
    }

    return Promise.reject(
      new ApiError({
        message:
          apiErr.message ||
          friendlyStatus(status) ||
          "Se ha producido un error inesperado.",
        code: apiErr.code || `http_${status}`,
        status,
        details: apiErr.details || null,
      })
    );
  }
);

function friendlyStatus(status) {
  const map = {
    400: "Solicitud incorrecta.",
    401: "Sesión no válida o caducada.",
    403: "No tienes acceso a este recurso.",
    404: "Recurso no encontrado.",
    409: "Conflicto con el estado actual.",
    413: "El archivo o la petición es demasiado grande.",
    422: "Los datos enviados no son válidos.",
    429: "Demasiadas peticiones, inténtalo más tarde.",
    500: "Error interno del servidor.",
    503: "Servicio no disponible.",
  };
  return map[status];
}
