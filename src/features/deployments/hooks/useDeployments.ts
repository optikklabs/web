import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import {
  getDeploymentCompare,
  getDeploymentDependencies,
  getDeploymentEndpoints,
  getDeploymentErrors,
  getDeploymentTraffic,
  getDeployments,
} from "../api/deploymentsApi";

interface DeploymentIdentity {
  readonly service: string;
  readonly version: string;
  readonly environment?: string;
}

export function useDeploymentsList() {
  return useTimeRangeQuery("deployments.list", (start, end, signal) =>
    getDeployments(start, end, signal)
  );
}

function enabled(identity: DeploymentIdentity): boolean {
  return Boolean(identity.service && identity.version && identity.environment !== undefined);
}

function keys(identity: DeploymentIdentity): readonly string[] {
  return [identity.service, identity.version, identity.environment ?? ""];
}

export function useDeploymentCompare(identity: DeploymentIdentity) {
  return useTimeRangeQuery(
    "deployments.compare",
    (start, end, signal) =>
      getDeploymentCompare(
        identity.service,
        identity.version,
        identity.environment ?? "",
        start,
        end,
        signal
      ),
    { enabled: enabled(identity), extraKeys: keys(identity) }
  );
}

export function useDeploymentTraffic(identity: DeploymentIdentity) {
  return useTimeRangeQuery(
    "deployments.traffic",
    (start, end, signal) =>
      getDeploymentTraffic(
        identity.service,
        identity.version,
        identity.environment ?? "",
        start,
        end,
        signal
      ),
    { enabled: enabled(identity), extraKeys: keys(identity) }
  );
}

export function useDeploymentErrors(identity: DeploymentIdentity) {
  return useTimeRangeQuery(
    "deployments.errors",
    (start, end, signal) =>
      getDeploymentErrors(
        identity.service,
        identity.version,
        identity.environment ?? "",
        start,
        end,
        50,
        signal
      ),
    { enabled: enabled(identity), extraKeys: keys(identity) }
  );
}

export function useDeploymentEndpoints(identity: DeploymentIdentity) {
  return useTimeRangeQuery(
    "deployments.endpoints",
    (start, end, signal) =>
      getDeploymentEndpoints(
        identity.service,
        identity.version,
        identity.environment ?? "",
        start,
        end,
        50,
        signal
      ),
    { enabled: enabled(identity), extraKeys: keys(identity) }
  );
}

export function useDeploymentDependencies(identity: DeploymentIdentity) {
  return useTimeRangeQuery(
    "deployments.dependencies",
    (start, end, signal) =>
      getDeploymentDependencies(
        identity.service,
        identity.version,
        identity.environment ?? "",
        start,
        end,
        50,
        signal
      ),
    { enabled: enabled(identity), extraKeys: keys(identity) }
  );
}
