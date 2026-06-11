/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // IMPORTANT: must match the GitHub repo name used later
  base: "/wc26-stickers/",
  plugins: [react()],
  test: {
    environment: "node",
  },
});
