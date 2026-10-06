import { useEffect, useRef, useState } from "react";

import type { CreateMonitorPayload, MonitorType } from "../../api/monitorsApi";

const DEFAULT: CreateMonitorPayload = {
  name: "",
  type: "metric",
  priority: "P2",
  scope: { tags: [] },
  query: {
    metric: { metric: "", aggregation: "avg", windowSec: 300 },
  },
  conditions: {
    comparator: "above",
    alertThreshold: 0.05,
    warnThreshold: 0.02,
    recoveryThreshold: 0.03,
    noDataAfterSec: 1800,
    noDataAs: "no_data",
  },
  notify: { channelIds: [] },
  evalEverySec: 300,
  tags: [],
};

function applyTypeDefaults(payload: CreateMonitorPayload, type: MonitorType): CreateMonitorPayload {
  switch (type) {
    case "metric":
      return {
        ...payload,
        type,
        query: payload.query.metric
          ? payload.query
          : { metric: { metric: "", aggregation: "avg", windowSec: 300 } },
      };
    case "apm":
      return {
        ...payload,
        type,
        query: payload.query.apm
          ? payload.query
          : { apm: { service: "", track: "errors", windowSec: 300 } },
      };
    case "log":
      return {
        ...payload,
        type,
        query: payload.query.log ? payload.query : { log: { query: "", windowSec: 300 } },
      };
  }
}

export function useWizardState(initial?: CreateMonitorPayload) {
  const [draft, setDraft] = useState<CreateMonitorPayload>(initial ?? DEFAULT);
  const seededFromInitial = useRef(false);

  useEffect(() => {
    if (initial && !seededFromInitial.current) {
      seededFromInitial.current = true;
      setDraft(initial);
    }
  }, [initial]);

  const setType = (type: MonitorType) => setDraft((prev) => applyTypeDefaults(prev, type));

  return { draft, setDraft, setType };
}
