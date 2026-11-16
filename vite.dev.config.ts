import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config";

export default defineConfig(
  mergeConfig(baseConfig, {
    server: {
      host: "0.0.0.0",
      port: 3000,
      allowedHosts: true,
    },
  }),
);
