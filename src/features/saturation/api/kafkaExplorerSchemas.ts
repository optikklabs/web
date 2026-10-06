import { z } from "zod";

export const topicThroughputSchema = z.object({
  topic: z.string(),
  bytesPerSec: z.number(),
  bytesTotal: z.number(),
  recordsPerSec: z.number(),
  recordsTotal: z.number(),
});

export const groupPartitionsSchema = z.object({
  consumerGroup: z.string(),
  assignedPartitions: z.number(),
  topicCount: z.number().int(),
  members: z.number(),
});

const kafkaSummarySchema = z.object({
  topicCount: z.number().int(),
  groupCount: z.number().int(),
  messagesPerSec: z.number(),
  assignedPartitions: z.number(),
});

export type TopicThroughputRow = z.infer<typeof topicThroughputSchema>;
export type GroupPartitionsRow = z.infer<typeof groupPartitionsSchema>;
export type KafkaSummary = z.infer<typeof kafkaSummarySchema>;
