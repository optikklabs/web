import type { KafkaSummary } from "@/features/saturation/api/kafkaExplorerSchemas";
import type { KafkaTopology } from "@/features/saturation/api/kafkaTopologySchemas";
import { type HealthVariant, healthVariantForErrorRate } from "@shared/utils/statusUtils";

export type Health = "healthy" | "warning" | "critical";

export interface ProductionRow {
  topic: string;
  rate: number;
  producerCount: number;
  consumerGroupCount: number;
}

export interface ConsumptionRow {
  group: string;
  topics: string[];
  rate: number;
  errorRate: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface ConsumerGroupRow {
  group: string;
  consumer: string;
  topic: string;
  rate: number;
  errorRate: number;
}

export interface KafkaPageModel {
  productionRate: number;
  productionErrorRate: number;
  productionP50Ms: number;
  productionP95Ms: number;
  productionP99Ms: number;
  consumptionRate: number;
  topicCount: number;
  consumerGroupCount: number;
  production: ProductionRow[];
  topics: ProductionRow[];
  consumption: ConsumptionRow[];
  consumerGroups: ConsumerGroupRow[];
}

export interface KafkaEmptyStateCopy {
  title: string;
  description: string;
}

export function kafkaEmptyStateCopy(summary: KafkaSummary | undefined): KafkaEmptyStateCopy {
  const hasMetrics =
    summary !== undefined &&
    (summary.topicCount > 0 ||
      summary.groupCount > 0 ||
      summary.messagesPerSec > 0 ||
      summary.assignedPartitions > 0);

  if (hasMetrics) {
    return {
      title: "Kafka topology unavailable",
      description:
        "Kafka metrics are available, but no service reported producer or consumer spans in this time range. Instrument Kafka spans to view service topology.",
    };
  }

  return {
    title: "No Kafka services found",
    description: "No service reported Kafka producer or consumer spans in this time range.",
  };
}

export function resolveKafkaService(
  services: readonly string[],
  requestedService: string | null
): string | null {
  if (requestedService && services.includes(requestedService)) return requestedService;
  return services[0] ?? null;
}

const HEALTH_BY_VARIANT: Record<HealthVariant, Health> = {
  success: "healthy",
  warning: "warning",
  error: "critical",
};

export function healthFromError(errorRate: number): Health {
  return HEALTH_BY_VARIANT[healthVariantForErrorRate(errorRate)];
}

export function formatRate(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return Math.round(value).toLocaleString();
}

export function buildKafkaPageModel(topo: KafkaTopology, service: string): KafkaPageModel {
  const topicsByName = new Map(topo.topics.map((topic) => [topic.topic, topic]));
  const producer = topo.producers.find((item) => item.service === service);

  const production = topo.edges
    .filter((edge) => edge.kind === "produce" && edge.source === service)
    .map((edge) => {
      const topic = topicsByName.get(edge.target);
      return {
        topic: edge.target,
        rate: edge.ratePerSec,
        producerCount: topic?.producerCount ?? 0,
        consumerGroupCount: topic?.consumerGroupCount ?? 0,
      };
    })
    .sort((a, b) => b.rate - a.rate || a.topic.localeCompare(b.topic));

  const consumption = topo.consumers
    .filter((consumer) => consumer.service === service)
    .map((consumer) => ({
      group: consumer.group,
      topics: Array.from(
        new Set(
          topo.pathways
            .filter((pathway) => pathway.consumer === service && pathway.group === consumer.group)
            .map((pathway) => pathway.topic)
        )
      ).sort(),
      rate: consumer.ratePerSec,
      errorRate: consumer.errorRate,
      p50Ms: consumer.p50Ms,
      p95Ms: consumer.p95Ms,
      p99Ms: consumer.p99Ms,
    }))
    .sort((a, b) => b.rate - a.rate || a.group.localeCompare(b.group));

  const consumerGroups = topo.pathways
    .map((pathway) => ({
      group: pathway.group,
      consumer: pathway.consumer,
      topic: pathway.topic,
      rate: pathway.consumeRatePerSec,
      errorRate: pathway.errorRate,
    }))
    .sort((a, b) => b.rate - a.rate || a.group.localeCompare(b.group));
  const topics = topo.topics.map((topic) => ({
    topic: topic.topic,
    rate: topic.ratePerSec,
    producerCount: topic.producerCount,
    consumerGroupCount: topic.consumerGroupCount,
  }));

  return {
    productionRate: producer?.ratePerSec ?? 0,
    productionErrorRate: producer?.errorRate ?? 0,
    productionP50Ms: producer?.p50Ms ?? 0,
    productionP95Ms: producer?.p95Ms ?? 0,
    productionP99Ms: producer?.p99Ms ?? 0,
    consumptionRate: consumption.reduce((total, row) => total + row.rate, 0),
    topicCount: topo.topics.length,
    consumerGroupCount: new Set(topo.pathways.map((pathway) => pathway.group)).size,
    production,
    topics,
    consumption,
    consumerGroups,
  };
}
