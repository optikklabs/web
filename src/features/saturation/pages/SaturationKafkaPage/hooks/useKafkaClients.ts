import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { getKafkaClients } from "@/features/saturation/api/kafkaTopologyApi";

/** Kafka client roster for the picker, independent of the scoped graph. */
export function useKafkaClients() {
  return useTimeRangeQuery<string[]>("saturation-kafka.clients", (s, e) => getKafkaClients(s, e));
}
