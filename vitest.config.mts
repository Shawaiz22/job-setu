import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
});
