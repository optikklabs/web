import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { type Host, getHosts } from "@shared/api/hosts";

export function useServiceHosts(serviceName: string) {
  return useTimeRangeQuery<Host[]>(
    "service-detail.hosts",
    (start, end) => getHosts(start, end, serviceName),
    { extraKeys: [serviceName], enabled: Boolean(serviceName) }
  );
}
