import { z } from "zod";

// Mirrors query/internal/modules/saturation/kafka/topology models.

const producerNodeSchema = z.object({
  service: z.string(),
  ratePerSec: z.number(),
  errorRate: z.number(),
  p50Ms: z.number(),
  p95Ms: z.number(),
  p99Ms: z.number(),
});

const topicNodeSchema = z.object({
  topic: z.string(),
  ratePerSec: z.number(),
  producerCount: z.number(),
  consumerGroupCount: z.number(),
});

const consumerNodeSchema = z.object({
  service: z.string(),
  group: z.string(),
  ratePerSec: z.number(),
  errorRate: z.number(),
  p50Ms: z.number(),
  p95Ms: z.number(),
  p99Ms: z.number(),
});

const streamEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  kind: z.enum(["produce", "consume"]),
  ratePerSec: z.number(),
});

const pathwaySchema = z.object({
  producer: z.string(),
  topic: z.string(),
  group: z.string(),
  consumer: z.string(),
  produceRatePerSec: z.number(),
  consumeRatePerSec: z.number(),
  errorRate: z.number(),
});

// Every slice is built with `make(..., 0, n)` server-side, so none are null.
export const kafkaTopologySchema = z.object({
  producers: z.array(producerNodeSchema),
  topics: z.array(topicNodeSchema),
  consumers: z.array(consumerNodeSchema),
  edges: z.array(streamEdgeSchema),
  pathways: z.array(pathwaySchema),
});

export const kafkaClientsSchema = z.array(z.string());

export type KafkaTopology = z.infer<typeof kafkaTopologySchema>;
