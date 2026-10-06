import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

declare module "axios" {
  // The response interceptor lifts the envelope's comparison sibling here so
  // `data` stays the payload for every caller.
  interface AxiosResponse {
    comparison?: unknown;
  }

  // Marks a request as part of the auth flow itself: no Bearer/tenant headers
  // are attached and a 401 never triggers the refresh-and-retry loop (the
  // refresh call must not recurse into itself).
  interface AxiosRequestConfig {
    authExempt?: boolean;
  }
}

import { API_CONFIG } from "@config/apiConfig";

import { invalidResponseError, isApiEnvelope } from "../utils/decode";
import { attachAuthInterceptor } from "./interceptors/authInterceptor";
import { attachErrorInterceptor } from "./interceptors/errorInterceptor";

const axiosClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  // Arrays go out as repeated keys (services=a&services=b), the form the API
  // reads, not axios's default services[]=a.
  paramsSerializer: { indexes: null },
});

attachAuthInterceptor(axiosClient);
axiosClient.interceptors.response.use((response) => {
  const body: unknown = response.data;
  if (!isApiEnvelope(body)) {
    return Promise.reject(invalidResponseError(body));
  }
  return { ...response, data: body.data, comparison: body.comparison };
});
attachErrorInterceptor(axiosClient);

async function unwrapResponse<T>(request: Promise<AxiosResponse<T>>): Promise<T> {
  const response = await request;
  return response.data;
}

/** A payload plus the same shape for the previous period, when requested. */
export interface Comparable<T> {
  readonly data: T;
  readonly comparison?: T;
}

async function unwrapComparable<T>(request: Promise<AxiosResponse<T>>): Promise<Comparable<T>> {
  const response = await request;
  return { data: response.data, comparison: response.comparison as T | undefined };
}

const api = {
  raw: axiosClient,
  request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    return unwrapResponse(axiosClient.request<T>(config));
  },
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return unwrapResponse(axiosClient.get<T>(url, config));
  },
  /** Use for endpoints called with compareTo; otherwise use get. */
  getComparable<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<Comparable<T>> {
    return unwrapComparable(axiosClient.get<T>(url, config));
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrapResponse(axiosClient.post<T>(url, data, config));
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrapResponse(axiosClient.put<T>(url, data, config));
  },
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrapResponse(axiosClient.patch<T>(url, data, config));
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return unwrapResponse(axiosClient.delete<T>(url, config));
  },
};

export { api };
export default api;
