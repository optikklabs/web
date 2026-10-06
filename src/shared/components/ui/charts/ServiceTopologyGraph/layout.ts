import { type Edge, type Node, Position } from "@xyflow/react";
import dagre from "dagre";

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 104;

/**
 * Compute deterministic left-to-right node positions using dagre.
 * Returns new Node objects with positions set.
 */
export function layoutTopology(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 48, ranksep: 96, marginx: 16, marginy: 16 });

  for (const n of nodes) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const e of edges) {
    g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}
