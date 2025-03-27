import type { Linter, ESLint } from "eslint"
import { YamlLang } from "./YamlLang.js"
import { getPackageJson } from "./getPackageJson.js"

const pkg = getPackageJson()

// Create singleton instance
const yamlLang = new YamlLang()

const processors = {
  [pkg.name]: {
    meta: {
      name: pkg.name,
      version: pkg.version,
    },
    preprocess: yamlLang.preprocess.bind(yamlLang),
    postprocess: yamlLang.postprocess.bind(yamlLang),
  },
} satisfies ESLint.Plugin["processors"]

const meta = {
  name: pkg.name,
  version: pkg.version,
  type: "problem",
  docs: {
    description: "YAML linting",
    category: "Parsing Issues",
    recommended: false,
    url: "https://github.com/aminya/eslint-plugin-yaml",
  },
  fixable: "code",
  schema: [],
}

const plugin = {
  meta,
  processors,
  configs: {
    recommended: {} as Linter.Config,
    legacy: {} as Linter.LegacyConfig,
  },
  languages: {
    yaml: yamlLang,
  },
} satisfies ESLint.Plugin

const files = ["**/*.yml", "**/*.yaml", "!**/node_modules/**", "!**/pnpm-lock.yaml", "**/.github/**.{yml,yaml}"]

const recommendedConfig: Linter.Config = {
  name: `${pkg.name}/recommended}`,
  files,
  plugins: {
    [pkg.name]: plugin,
  },
  language: `${pkg.name}/yaml`,
  languageOptions: {},
}

plugin.configs.recommended = recommendedConfig

const legacyConfig: Linter.LegacyConfig = {
  overrides: [
    {
      plugins: [pkg.name],
      files,
      processor: `yaml/${pkg.name}`,
    },
  ],
}

plugin.configs.legacy = legacyConfig

export default plugin
