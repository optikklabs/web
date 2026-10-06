import { api } from "@shared/api/http/client";

export async function infraGet<T>(
  path: string,
  startMs: number,
  endMs: number,
  extraParams?: Record<string, string | number | undefined>
): Promise<T> {
  const params: Record<string, string | number> = {
    startTime: startMs,
    endTime: endMs,
  };
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v !== undefined && v !== "") {
        params[k] = v;
      }
    }
  }
  const raw = await api.get<unknown>(path, { params });
  return raw as T;
}
