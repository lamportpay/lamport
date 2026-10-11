import { defineConfig } from "vitest/config";

// Standalone config: the app's vite.config.ts loads TanStack Start plugins that
// are not needed (and not safe) for the Node-based test runner.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/support/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": new URL("./src/", import.meta.url).pathname,
      // Matches the vite.config.ts alias used by src/lib/buffer-polyfill.ts.
      "lamportpay-real-buffer": new URL("./node_modules/buffer/index.js", import.meta.url).pathname,
    },
  },
});
