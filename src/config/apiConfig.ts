export const API_PROXY_BASE = "/api";
const API_TIMEOUT_MS = 30000;

export const DEV_FRONTEND_PORT = 3000;
const DEV_BACKEND_HOST = "localhost";
const DEV_BACKEND_PORT = 19090;
export const DEV_BACKEND_URL = `http://${DEV_BACKEND_HOST}:${DEV_BACKEND_PORT}`;

const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/v1/auth/login",
    SIGNUP: "/v1/auth/signup",
    VERIFY_EMAIL: "/v1/auth/verify-email",
    REFRESH: "/v1/auth/refresh",
    LOGOUT: "/v1/auth/logout",
    DEVICE_APPROVE: "/v1/auth/device/approve",
    FORGOT_PASSWORD: "/v1/auth/forgot-password",
    RESET_PASSWORD: "/v1/auth/reset-password",
    CHANGE_PASSWORD: "/v1/auth/change-password",
  },
  V1_BASE: "/v1",
  DASHBOARDS: {
    PAGES: "/v1/dashboard-pages",
  },
} as const;

export const API_V1_BASE = API_ENDPOINTS.V1_BASE;

export const API_CONFIG = {
  BASE_URL: API_PROXY_BASE,
  TIMEOUT: API_TIMEOUT_MS,
  ENDPOINTS: API_ENDPOINTS,
} as const;
