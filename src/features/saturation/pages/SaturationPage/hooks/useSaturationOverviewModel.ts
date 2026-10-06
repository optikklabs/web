import type { ApiErrorShape } from "@shared/api/utils/errorNormalization";
import { useMemo } from "react";

import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { type Host, getHosts } from "@shared/api/hosts";

import { getKafkaSummary } from "../../../api/kafkaExplorerApi";
import type { KafkaSummary } from "../../../api/kafkaExplorerSchemas";
import { useDatastoreSystems } from "../../../hooks/useDatastoreSystems";

import { summarizeDatastores } from "../view-models/datastoreSummary";
import {
  type SubsystemCardSpec,
  buildDatabaseCardSpec,
  buildKafkaCardSpec,
  buildOverviewSummary,
} from "../view-models/subsystemSpecs";

const HOSTS_LIMIT = 10;

export type SaturationOverviewModel = {
  isPending: boolean;
  error: ApiErrorShape | null;
  cards: SubsystemCardSpec[];
  hosts: Host[];
  topHosts: Host[];
  summary: ReturnType<typeof buildOverviewSummary>;
  counts: { database: number; topics: number };
};

function firstError(...errors: Array<ApiErrorShape | null>): ApiErrorShape | null {
  return errors.find((e) => e !== null) ?? null;
}

export function useSaturationOverviewModel(): SaturationOverviewModel {
  const datastoreSystems = useDatastoreSystems();
  const kafkaSummary = useTimeRangeQuery<KafkaSummary>(
    "saturation-overview-kafka-summary",
    (s, e) => getKafkaSummary(s, e)
  );
  const hostSaturation = useTimeRangeQuery<Host[]>("saturation-overview-hosts", (s, e) =>
    getHosts(s, e)
  );

  const systems = datastoreSystems.data ?? [];
  const hosts = hostSaturation.data ?? [];

  const cards = [buildKafkaCardSpec(kafkaSummary.data), buildDatabaseCardSpec(systems)];
  const topHosts = hosts.slice(0, HOSTS_LIMIT);
  const summary = useMemo(
    () =>
      buildOverviewSummary(
        datastoreSystems.data && summarizeDatastores(datastoreSystems.data),
        kafkaSummary.data
      ),
    [datastoreSystems.data, kafkaSummary.data]
  );
  const counts = {
    database: systems.filter((row) => row.category === "database").length,
    topics: kafkaSummary.data?.topicCount ?? 0,
  };

  const isPending =
    datastoreSystems.isPending || kafkaSummary.isPending || hostSaturation.isPending;

  return {
    isPending,
    error: firstError(datastoreSystems.error, kafkaSummary.error, hostSaturation.error),
    cards,
    hosts,
    topHosts,
    summary,
    counts,
  };
}
