import { useLocation } from "@tanstack/react-router";

export interface ServiceIdentity {
  readonly serviceName: string;
  readonly isValid: boolean;
}

/**
 * Pulls the `$serviceName` segment from the current `/services/:serviceName`
 * URL. Returns an `isValid` flag so the page can short-circuit to a friendly
 * empty state when the URL is malformed.
 */
export function useServiceDetailIdentity(): ServiceIdentity {
  const location = useLocation();
  const encoded = /^\/services\/([^/?#]+)/.exec(location.pathname)?.[1];
  const raw = encoded ? decodeURIComponent(encoded) : "";
  return { serviceName: raw, isValid: Boolean(raw) };
}
