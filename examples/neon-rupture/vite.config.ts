import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/three/")) {
            return "three";
          }
          if (id.includes("/gamekit/packages/")) {
            return "gamekit";
          }
          return undefined;
        }
      }
    }
  },
  server: {
    port: 4173
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
