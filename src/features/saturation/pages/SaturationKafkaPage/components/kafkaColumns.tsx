import type { ReactNode } from "react";

import { formatDuration } from "@shared/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";

import {
  type ConsumerGroupRow,
  type ConsumptionRow,
  type ProductionRow,
  formatRate,
} from "../kafkaPageModel";
import { ErrorRate } from "./KafkaPrimitives";

const right = { align: "right" } as const;

function metricColumn<T>(header: string, value: (row: T) => ReactNode): ColumnDef<T> {
  return { id: header, header, meta: right, cell: ({ row }) => value(row.original) };
}

export const productionColumns: ColumnDef<ProductionRow>[] = [
  {
    header: "Topic",
    accessorKey: "topic",
    cell: ({ row }) => <span className="font-medium font-mono">{row.original.topic}</span>,
  },
  metricColumn("Messages/sec", (row: ProductionRow) => (
    <span className="tabular-nums">{formatRate(row.rate)}</span>
  )),
  metricColumn("Producers", (row: ProductionRow) => (
    <span className="tabular-nums">{row.producerCount}</span>
  )),
  metricColumn("Groups", (row: ProductionRow) => (
    <span className="tabular-nums">{row.consumerGroupCount}</span>
  )),
];

export const consumptionColumns: ColumnDef<ConsumptionRow>[] = [
  {
    header: "Consumer group",
    accessorKey: "group",
    cell: ({ row }) => <span className="font-medium font-mono">{row.original.group}</span>,
  },
  {
    header: "Topics",
    accessorKey: "topics",
    cell: ({ row }) => {
      const topics = row.original.topics.join(", ");
      return (
        <span className="block max-w-48 truncate text-foreground-muted" title={topics}>
          {topics || "—"}
        </span>
      );
    },
  },
  metricColumn("Messages/sec", (row: ConsumptionRow) => (
    <span className="tabular-nums">{formatRate(row.rate)}</span>
  )),
  ...(["p50Ms", "p95Ms", "p99Ms"] as const).map(
    (key): ColumnDef<ConsumptionRow> =>
      metricColumn(key.slice(0, 3).toUpperCase(), (row) => (
        <span className="tabular-nums">{formatDuration(row[key])}</span>
      ))
  ),
  metricColumn("Errors", (row: ConsumptionRow) => <ErrorRate value={row.errorRate} />),
];

export const groupColumns: ColumnDef<ConsumerGroupRow>[] = [
  {
    header: "Group",
    accessorKey: "group",
    cell: ({ row }) => <span className="font-medium font-mono">{row.original.group}</span>,
  },
  ...(["consumer", "topic"] as const).map(
    (key): ColumnDef<ConsumerGroupRow> => ({
      header: key[0].toUpperCase() + key.slice(1),
      accessorKey: key,
      cell: ({ row }) => (
        <span className="font-mono text-foreground-muted">{row.original[key]}</span>
      ),
    })
  ),
  metricColumn("Messages/sec", (row: ConsumerGroupRow) => (
    <span className="tabular-nums">{formatRate(row.rate)}</span>
  )),
  metricColumn("Errors", (row: ConsumerGroupRow) => <ErrorRate value={row.errorRate} />),
];
