import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "server-only": fileURLToPath(
        new URL("./src/test/server-only.stub.ts", import.meta.url),
      ),
    },
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Los tests de integración de UI encadenan más de diez interacciones de
    // userEvent con re-render completo en jsdom. El umbral por defecto de
    // 5000 ms los deja al filo y produce fallos por tiempo —no funcionales—
    // cuando la máquina corre los 27 archivos en paralelo.
    testTimeout: 20_000,
  },
});
