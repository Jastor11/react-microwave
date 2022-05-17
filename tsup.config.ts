import { defineConfig } from "tsup"
import type { Options, Format } from "tsup"
import path from "node:path"

import packageJson from "./package.json"

const tsupOptions = defineConfig((options) => {
  const isProd = options.env?.NODE_ENV.toLowerCase() === "production"

  const config = {
    name: "Microwave React testing library compilation with TS-UP",
    entry: options.entry ?? ["src/index.ts"],
    clean: options.clean ?? false,
    minify: options.minify ?? false,
    platform: options.platform ?? "browser",
    replaceNodeEnv: isProd,
    target: options.target ?? "esnext",
    format: ["esm", "cjs"] as Format[],
    external: options.external ?? [],
    dts: {
      entry: "src/index.ts",
    },
    outDir: options.outDir ?? path.join(__dirname, "dist"),
    watch: isProd ? false : true,

    define: {
      __BUILD_TIME__: Date.now().toString(),
      __DEV__: JSON.stringify(!isProd),
      __VERSION__: JSON.stringify(packageJson.version),
    },

    esbuildPlugins: [],
  } as Options

  return config
})

export default tsupOptions
