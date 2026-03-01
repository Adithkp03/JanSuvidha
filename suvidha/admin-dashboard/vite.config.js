// Purpose: Vite config for admin dashboard; sets base path so it can be served under `/admin/`.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/admin/",
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true
  }
});

