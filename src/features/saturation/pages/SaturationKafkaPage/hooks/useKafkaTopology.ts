import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { getKafkaTopology } from "@/features/saturation/api/kafkaTopologyApi";
import type { KafkaTopology } from "@/features/saturation/api/kafkaTopologySchemas";

/** Topology for the selected service. */
export function useKafkaTopology(service: string | null) {
  return useTimeRangeQuery<KafkaTopology>(
    "saturation-kafka.topology",
    (s, e) => getKafkaTopology(s, e, service ?? ""),
    {
      extraKeys: [service ?? ""],
      enabled: service != null,
      placeholderData: undefined,
    }
  );
}
