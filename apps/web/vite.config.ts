import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Load env from the workspace root so VITE_LPLENS_AGENT_CONTRACT,
// VITE_LPLENS_API_URL, VITE_OG_NEWTON_RPC etc. resolved by /agent +
// /developers + usePermit2Migration come from the same .env the
// server reads — single source of truth across server + web.
export default defineConfig({
  plugins: [react()],
  envDir: "../../",
  server: {
    port: 3100,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
});
