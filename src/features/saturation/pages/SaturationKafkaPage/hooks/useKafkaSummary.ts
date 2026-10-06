import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { getKafkaSummary } from "@/features/saturation/api/kafkaExplorerApi";
import type { KafkaSummary } from "@/features/saturation/api/kafkaExplorerSchemas";

export function useKafkaSummary() {
  return useTimeRangeQuery<KafkaSummary>("saturation-kafka.summary", (s, e) =>
    getKafkaSummary(s, e)
  );
}
