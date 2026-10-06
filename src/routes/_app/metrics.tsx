import { createFileRoute } from "@tanstack/react-router";

import { validateMetricsExplorerSearch } from "@/features/metrics/search";

export const Route = createFileRoute("/_app/metrics")({
  validateSearch: validateMetricsExplorerSearch,
});
