import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  type CreateDashboardPagePayload,
  type CreateWidgetPayload,
  createDashboardPage,
  createWidget,
  deleteDashboardPage,
  deleteWidget,
  updateDashboardPage,
  updateWidget,
} from "@shared/dashboards/api/dashboardsApi";

const invalidateList = (client: ReturnType<typeof useQueryClient>) =>
  void client.invalidateQueries({ queryKey: ["dashboards", "pages"] });

const invalidatePage = (client: ReturnType<typeof useQueryClient>, pageId: number) =>
  void client.invalidateQueries({ queryKey: ["dashboards", "page", pageId] });

export function useCreateDashboardPage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDashboardPagePayload) => createDashboardPage(payload),
    onSuccess: () => invalidateList(client),
  });
}

export function useUpdateDashboardPage(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDashboardPagePayload) => updateDashboardPage(id, payload),
    onSuccess: () => {
      invalidatePage(client, id);
      invalidateList(client);
    },
  });
}

export function useDeleteDashboardPage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDashboardPage(id),
    onSuccess: () => invalidateList(client),
  });
}

export function useCreateWidget(pageId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWidgetPayload) => createWidget(pageId, payload),
    onSuccess: () => invalidatePage(client, pageId),
  });
}

export function useUpdateWidget(pageId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ widgetId, payload }: { widgetId: number; payload: CreateWidgetPayload }) =>
      updateWidget(pageId, widgetId, payload),
    onSuccess: () => invalidatePage(client, pageId),
  });
}

export function useDeleteWidget(pageId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (widgetId: number) => deleteWidget(pageId, widgetId),
    onSuccess: () => invalidatePage(client, pageId),
  });
}
