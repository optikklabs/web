import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { type DashboardPanelSpec, dashboardPanelSpecSchema } from "@shared/types/dashboardConfig";
import { z } from "zod";

const PAGES = API_CONFIG.ENDPOINTS.DASHBOARDS.PAGES;

const dashboardPageSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string(),
  iconColor: z.string(),
  tags: z.array(z.string()),
  isFavorite: z.boolean(),
  widgetCount: z.number(),
  owner: z.object({ name: z.string(), initials: z.string() }).optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

/** A persisted Dashboard (widget): its full definition round-trips via spec. */
const dashboardSchema = z.object({
  id: z.number(),
  pageId: z.number(),
  spec: dashboardPanelSpecSchema,
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

const dashboardPageDetailSchema = dashboardPageSchema.extend({
  widgets: z.array(dashboardSchema),
});

const dashboardPageListSchema = z.object({
  items: z.array(dashboardPageSchema),
  total: z.number(),
});

export type DashboardPage = z.infer<typeof dashboardPageSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardPageDetail = z.infer<typeof dashboardPageDetailSchema>;
export type DashboardPageListResponse = z.infer<typeof dashboardPageListSchema>;

export interface ListDashboardPagesParams {
  readonly q?: string;
  readonly favorite?: boolean;
  readonly tag?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface CreateDashboardPagePayload {
  name: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface CreateWidgetPayload {
  spec: DashboardPanelSpec;
  position?: number;
}

export async function listDashboardPages(
  params: ListDashboardPagesParams = {}
): Promise<DashboardPageListResponse> {
  return validateResponse(dashboardPageListSchema, await api.get<unknown>(PAGES, { params }));
}

export async function getDashboardPage(id: number): Promise<DashboardPageDetail> {
  return validateResponse(dashboardPageDetailSchema, await api.get<unknown>(`${PAGES}/${id}`));
}

export async function createDashboardPage(
  payload: CreateDashboardPagePayload
): Promise<DashboardPage> {
  return validateResponse(dashboardPageSchema, await api.post<unknown>(PAGES, payload));
}

export async function updateDashboardPage(
  id: number,
  payload: CreateDashboardPagePayload
): Promise<DashboardPage> {
  return validateResponse(dashboardPageSchema, await api.put<unknown>(`${PAGES}/${id}`, payload));
}

export async function deleteDashboardPage(id: number): Promise<void> {
  await api.delete<unknown>(`${PAGES}/${id}`);
}

export async function createWidget(
  pageId: number,
  payload: CreateWidgetPayload
): Promise<Dashboard> {
  return validateResponse(
    dashboardSchema,
    await api.post<unknown>(`${PAGES}/${pageId}/dashboards`, payload)
  );
}

export async function updateWidget(
  pageId: number,
  widgetId: number,
  payload: CreateWidgetPayload
): Promise<Dashboard> {
  return validateResponse(
    dashboardSchema,
    await api.put<unknown>(`${PAGES}/${pageId}/dashboards/${widgetId}`, payload)
  );
}

export async function deleteWidget(pageId: number, widgetId: number): Promise<void> {
  await api.delete<unknown>(`${PAGES}/${pageId}/dashboards/${widgetId}`);
}
