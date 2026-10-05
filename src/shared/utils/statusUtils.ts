import { SERVICE_HEALTH_THRESHOLDS } from "@shared/constants/healthThresholds";

export type HealthVariant = "success" | "warning" | "error";

/**
 * Returns health status variant ("success", "warning", "error") for an error-rate
 * percentage against SERVICE_HEALTH_THRESHOLDS (boundaries inclusive).
 */
export function healthVariantForErrorRate(errorRate: number | undefined): HealthVariant {
  if (errorRate === undefined || errorRate === null) return "success";
  if (errorRate >= SERVICE_HEALTH_THRESHOLDS.unhealthy) return "error";
  if (errorRate >= SERVICE_HEALTH_THRESHOLDS.degraded) return "warning";
  return "success";
}

/**
 * Returns human-readable health status label ("Healthy", "Warning", "Critical") based on error rate percentage thresholds.
 */
export function healthLabelForErrorRate(errorRate: number | undefined): string {
  const variant = healthVariantForErrorRate(errorRate);
  if (variant === "error") return "Critical";
  if (variant === "warning") return "Warning";
  return "Healthy";
}
