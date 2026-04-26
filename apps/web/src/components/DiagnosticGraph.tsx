import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { DiagnosticEvent } from "@lplens/core";

interface Props {
  events: DiagnosticEvent[];
}

const NODE_STYLE = {
  background: "#0f1729",
  border: "1px solid rgb(56 189 248 / 0.4)",
  color: "#a5f3fc",
  borderRadius: 8,
  padding: 8,
  fontSize: 12,
  width: 160,
};

const EDGE_STYLE = {
  stroke: "#475569",
};

function buildGraph(events: DiagnosticEvent[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const phases = events.filter(
    (e): e is Extract<DiagnosticEvent, { type: "phase.start" }> =>
      e.type === "phase.start",
  );

  if (phases.length === 0) {
    return {
      nodes: [
        {
          id: "waiting",
          position: { x: 240, y: 120 },
          data: { label: "waiting for stream…" },
          style: { ...NODE_STYLE, color: "#64748b" },
        },
      ],
      edges: [],
    };
  }

  const nodes: Node[] = phases.map((p, i) => ({
    id: `phase-${p.phase}-${i}`,
    position: { x: i * 200, y: 200 },
    data: { label: `phase ${p.phase}\n${p.label}` },
    style: NODE_STYLE,
  }));

  const edges: Edge[] = [];
  for (let i = 1; i < phases.length; i++) {
    edges.push({
      id: `e-${i}`,
      source: `phase-${phases[i - 1].phase}-${i - 1}`,
      target: `phase-${phases[i].phase}-${i}`,
      animated: true,
      style: EDGE_STYLE,
    });
  }

  return { nodes, edges };
}

export function DiagnosticGraph({ events }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(events), [events]);

  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden bg-slate-950">
      <div style={{ height: 360 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1f2937" gap={16} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
