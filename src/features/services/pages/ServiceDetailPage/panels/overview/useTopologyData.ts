import type { ServiceTopologyResponse } from "@shared/api/topology";
import { CHART_THEME_DEFAULTS } from "@shared/utils/chartTheme";
import { fmtNum } from "@shared/utils/formatters";
import { useMemo } from "react";
import type { ServiceMapEdge, ServiceMapNode } from "./TopologySVG";

export interface ServiceMapListItem {
  name: string;
  callCount: number;
  errorRate: number;
  status: "ok" | "warn" | "err";
}

export function useTopologyData(
  topologyData: ServiceTopologyResponse | undefined,
  selectedFocus: string
) {
  return useMemo(() => {
    if (!topologyData) {
      return { nodes: [], edges: [], upstreamList: [], downstreamList: [] };
    }

    const { nodes: rawNodes, edges: rawEdges } = topologyData;

    const focusNode = rawNodes.find((n) => n.name === selectedFocus);
    const upEdges = rawEdges.filter((e) => e.target === selectedFocus);
    const downEdges = rawEdges.filter((e) => e.source === selectedFocus);

    const mapStatus = (rate: number): "ok" | "warn" | "err" => {
      if (rate >= 2) return "err";
      if (rate >= 0.5) return "warn";
      return "ok";
    };

    const computedNodes: ServiceMapNode[] = [];
    const computedEdges: ServiceMapEdge[] = [];
    const upList: ServiceMapListItem[] = [];
    const downList: ServiceMapListItem[] = [];

    const centerNodeStatus = focusNode ? mapStatus(focusNode.errorRate) : "ok";
    computedNodes.push({
      name: selectedFocus,
      sub: "Active Service",
      x: 350,
      y: 155,
      status: centerNodeStatus,
      isCenter: true,
    });

    const uCount = upEdges.length;
    upEdges.forEach((edge, i) => {
      const nodeInfo = rawNodes.find((n) => n.name === edge.source);
      const status = nodeInfo ? mapStatus(nodeInfo.errorRate) : "ok";
      const y = uCount === 1 ? 180 : 30 + i * (340 / Math.max(1, uCount - 1));

      computedNodes.push({
        name: edge.source,
        sub: `upstream · ${edge.callCount} calls`,
        x: 30,
        y,
        status,
      });

      const path = `M 210,${y + 30} C 280,${y + 30} 280,185 350,200`;
      computedEdges.push({
        path,
        width: Math.max(2, Math.min(6, edge.callCount / 1000)),
        color:
          status === "err"
            ? CHART_THEME_DEFAULTS.err()
            : status === "warn"
              ? CHART_THEME_DEFAULTS.warn()
              : CHART_THEME_DEFAULTS.ok(),
        label: `${fmtNum(edge.callCount)} calls`,
        lx: 280,
        ly: y + 20,
        dur: "3s",
        delay: `${(i * 0.4).toFixed(1)}s`,
      });

      upList.push({
        name: edge.source,
        callCount: edge.callCount,
        errorRate: edge.errorRate,
        status,
      });
    });

    const dCount = downEdges.length;
    downEdges.forEach((edge, i) => {
      const nodeInfo = rawNodes.find((n) => n.name === edge.target);
      const status = nodeInfo ? mapStatus(nodeInfo.errorRate) : "ok";
      const y = dCount === 1 ? 180 : 30 + i * (340 / Math.max(1, dCount - 1));

      computedNodes.push({
        name: edge.target,
        sub: `downstream · ${edge.callCount} calls`,
        x: 670,
        y,
        status,
      });

      const path = `M 530,210 C 600,210 600,${y + 30} 670,${y + 30}`;
      computedEdges.push({
        path,
        width: Math.max(2, Math.min(6, edge.callCount / 1000)),
        color:
          status === "err"
            ? CHART_THEME_DEFAULTS.err()
            : status === "warn"
              ? CHART_THEME_DEFAULTS.warn()
              : CHART_THEME_DEFAULTS.ok(),
        label: `${fmtNum(edge.callCount)} calls`,
        lx: 600,
        ly: y + 20,
        dur: "2.8s",
        delay: `${(i * 0.5).toFixed(1)}s`,
      });

      downList.push({
        name: edge.target,
        callCount: edge.callCount,
        errorRate: edge.errorRate,
        status,
      });
    });

    return {
      nodes: computedNodes,
      edges: computedEdges,
      upstreamList: upList,
      downstreamList: downList,
    };
  }, [topologyData, selectedFocus]);
}
