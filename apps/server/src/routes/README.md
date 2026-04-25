# /api/diagnose/:tokenId

Server-Sent Events stream that drives the live diagnostic UI. Today the
endpoint emits a scripted sequence of `DiagnosticEvent`s; the real 9-phase
agent will replace the fake emitter without changing the wire format.

## Wire format

`text/event-stream` of `DiagnosticEvent` JSON objects, one per `data:` frame.
Types are defined in `@lplens/core`:

- `phase.start` / `phase.end`
- `tool.call` / `tool.result`
- `narrative` (typewriter text)
- `node.add` / `edge.draw` / `edge.pulse` (React Flow graph hints)
- `verdict.partial` / `verdict.final`
- `report.uploaded` / `report.anchored`
- `error`

The first event is always a `phase.start` for phase `0` (preflight) so the
client can show subgraph readiness before any real work begins.

## Try it

```bash
curl -N http://localhost:3001/api/diagnose/123456
```

Each `data: { ... }` frame should arrive within a second of the previous one.
