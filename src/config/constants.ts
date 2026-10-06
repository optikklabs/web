/**
 * Application Configuration
 * Centralized configuration for the entire React application
 */

export const TIME_RANGES: import("@shared/types").RelativeTimeRange[] = [
  { kind: "relative", label: "Last 5 minutes", preset: "5m", minutes: 5 },
  { kind: "relative", label: "Last 15 minutes", preset: "15m", minutes: 15 },
  { kind: "relative", label: "Last 30 minutes", preset: "30m", minutes: 30 },
  { kind: "relative", label: "Last 1 hour", preset: "1h", minutes: 60 },
  { kind: "relative", label: "Last 3 hours", preset: "3h", minutes: 180 },
  { kind: "relative", label: "Last 6 hours", preset: "6h", minutes: 360 },
  { kind: "relative", label: "Last 12 hours", preset: "12h", minutes: 720 },
  { kind: "relative", label: "Last 24 hours", preset: "24h", minutes: 1440 },
  { kind: "relative", label: "Last 7 days", preset: "7d", minutes: 10080 },
  { kind: "relative", label: "Last 30 days", preset: "30d", minutes: 43200 },
];
export const STORAGE_KEYS = {
  APP_STATE: "optikk_app_state",
};

export const AUTO_REFRESH_INTERVALS = [
  { label: "Off", value: 0 },
  { label: "5s", value: 5_000 },
  { label: "10s", value: 10_000 },
  { label: "30s", value: 30_000 },
  { label: "1m", value: 60_000 },
  { label: "5m", value: 300_000 },
  { label: "15m", value: 900_000 },
  { label: "30m", value: 1_800_000 },
  { label: "1h", value: 3_600_000 },
] as const;
