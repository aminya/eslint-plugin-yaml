import type { Linter, ESLint } from "eslint"
import { YamlProcessor } from "./YamlProcessor.js"
import { getPackageJson } from "./getPackageJson.js"

const pkg = getPackageJson()

// Create singleton instance
const yamlProcessor = new YamlProcessor()

const parser: Linter.ESTreeParser = {
  meta: {
    name: "yaml-eslint-parser",
    version: pkg.version,
  },
  parseForESLint: yamlProcessor.parseForESLint.bind(yamlProcessor),
}

const processors = {
  [pkg.name]: {
    meta: {
      name: pkg.name,
      version: pkg.version,
    },
    postprocess: yamlProcessor.postprocess.bind(yamlProcessor),
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
} satisfies ESLint.Plugin

const files = ["**/*.yml", "**/*.yaml", "!**/node_modules/**", "!**/pnpm-lock.yaml", "**/.github/**.{yml,yaml}"]

const recommendedConfig: Linter.Config = {
  name: `${pkg.name}/recommended}`,
  files,
  processor: {
    name: pkg.name,
    preprocess: yamlProcessor.preprocess.bind(yamlProcessor),
    postprocess: yamlProcessor.postprocess.bind(yamlProcessor),
  },
  plugins: {
    [pkg.name]: plugin,
  },
  languageOptions: {
    parser,
  },
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
