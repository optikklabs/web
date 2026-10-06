import { skipToken } from "@tanstack/react-query";

import { useStandardQuery } from "@/shared/hooks/useStandardQuery";

import {
  type Monitor,
  type MonitorEvent,
  type MonitorSeriesResponse,
  type StatusTimelineResponse,
  getMonitor,
  getMonitorEvents,
  getMonitorSeries,
  getMonitorStatusTimeline,
} from "../api/monitorsApi";

export function useMonitorDetail(id: number | undefined) {
  return useStandardQuery<Monitor>({
    queryKey: ["monitors", "detail", id],
    queryFn: id === undefined ? skipToken : () => getMonitor(id),
  });
}

export function useMonitorSeriesQuery(id: number | undefined, windowMs: number) {
  return useStandardQuery<MonitorSeriesResponse>({
    queryKey: ["monitors", "series", id, windowMs],
    queryFn: id === undefined ? skipToken : () => getMonitorSeries(id, windowMs),
  });
}

export function useMonitorEventsQuery(id: number | undefined, limit = 10) {
  return useStandardQuery<MonitorEvent[]>({
    queryKey: ["monitors", "events", id, limit],
    queryFn: id === undefined ? skipToken : () => getMonitorEvents(id, limit),
  });
}

export function useStatusTimelineQuery(id: number | undefined, windowMs: number) {
  return useStandardQuery<StatusTimelineResponse>({
    queryKey: ["monitors", "status-timeline", id, windowMs],
    queryFn: id === undefined ? skipToken : () => getMonitorStatusTimeline(id, windowMs),
  });
}
