import module from "module"
import { defineConfig, type UserConfig } from "vite"
import babel from "vite-plugin-babel"
import babelConfig from "./babel.config.mts"

// Instead of using TARGET env variable, we'll use Vite's mode
export default defineConfig(async (configEnv) => {
  const isLegacy = configEnv.mode.includes("legacy")

  const plugins = isLegacy
    ? [
        babel({
          babelConfig,
        }),
      ]
    : []

  return {
    build: {
      ssr: isLegacy ? "./src/index.cts" : "./src/index.ts",
      outDir: "./dist",
      target: isLegacy ? "node12" : "node20",
      minify: false,
      sourcemap: true,
      rollupOptions: {
        output: {
          format: isLegacy ? "cjs" : "es",
        },
      },
      emptyOutDir: false,
    },
    ssr: {
      target: "node",
      noExternal: true,
      external: [...module.builtinModules, "js-yaml", "jshint"],
    },
    plugins,
  } as UserConfig
})
