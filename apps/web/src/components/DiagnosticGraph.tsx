import { ReactFlow, Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

const PLACEHOLDER_NODES = [
  {
    id: "position",
    position: { x: 240, y: 120 },
    data: { label: "Position" },
    style: {
      background: "#0f1729",
      border: "1px solid rgb(56 189 248 / 0.4)",
      color: "#a5f3fc",
      borderRadius: 8,
      padding: 8,
      fontSize: 12,
    },
  },
];

const PLACEHOLDER_EDGES: never[] = [];

export function DiagnosticGraph() {
  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden bg-slate-950">
      <div style={{ height: 360 }}>
        <ReactFlow
          nodes={PLACEHOLDER_NODES}
          edges={PLACEHOLDER_EDGES}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background color="#1f2937" gap={16} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
