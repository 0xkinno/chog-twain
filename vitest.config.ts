import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)), "@rules": fileURLToPath(new URL("./packages/rules/src", import.meta.url)) } },
  test: { include: ["packages/**/*.test.ts", "src/**/*.test.ts"], environment: "node" },
});