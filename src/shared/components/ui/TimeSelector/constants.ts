import type { RelativeTimeRange } from "@shared/types";

interface RangeGroupItem extends RelativeTimeRange {}

export interface RangeGroup {
  title: string;
  items: RangeGroupItem[];
}

export const RANGE_GROUPS: RangeGroup[] = [
  {
    title: "Minutes",
    items: [
      { kind: "relative", label: "Last 5 minutes", preset: "5m", minutes: 5 },
      { kind: "relative", label: "Last 15 minutes", preset: "15m", minutes: 15 },
      { kind: "relative", label: "Last 30 minutes", preset: "30m", minutes: 30 },
    ],
  },
  {
    title: "Hours",
    items: [
      { kind: "relative", label: "Last 1 hour", preset: "1h", minutes: 60 },
      { kind: "relative", label: "Last 3 hours", preset: "3h", minutes: 180 },
      { kind: "relative", label: "Last 6 hours", preset: "6h", minutes: 360 },
      { kind: "relative", label: "Last 12 hours", preset: "12h", minutes: 720 },
      { kind: "relative", label: "Last 24 hours", preset: "24h", minutes: 1440 },
    ],
  },
  {
    title: "Days",
    items: [
      { kind: "relative", label: "Last 2 days", preset: "2d", minutes: 2880 },
      { kind: "relative", label: "Last 7 days", preset: "7d", minutes: 10080 },
      { kind: "relative", label: "Last 30 days", preset: "30d", minutes: 43200 },
    ],
  },
];

export const DISPLAY_MAP: Record<string, string> = {
  "5m": "Last 5 minutes",
  "15m": "Last 15 minutes",
  "30m": "Last 30 minutes",
  "1h": "Last 1 hour",
  "3h": "Last 3 hours",
  "6h": "Last 6 hours",
  "12h": "Last 12 hours",
  "24h": "Last 24 hours",
  "2d": "Last 2 days",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

const COMPARISON_OPTIONS = [
  { value: "off" as const, label: "Off" },
  { value: "previous_period" as const, label: "Previous period" },
  { value: "previous_day" as const, label: "Previous day" },
  { value: "previous_week" as const, label: "Previous week" },
];

export type ComparisonMode = (typeof COMPARISON_OPTIONS)[number]["value"];
