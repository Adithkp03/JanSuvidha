// Purpose: Vite config for kiosk UI; sets base path so it can be served under `/kiosk/`.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/kiosk/",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});

