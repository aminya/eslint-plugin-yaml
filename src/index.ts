import { loadAll } from "js-yaml"
import { JSHINT as jshint, type LintError as JsHintLintErrors } from "jshint"
import type { Linter, ESLint, AST } from "eslint"
import path from "path"
import type * as estree from "estree"
import { valueToEstree } from "estree-util-value-to-estree"
import fs from "fs"
import { fileURLToPath } from "url"

function getPackageJson(): { name: string; version: string } {
  try {
    const dirname = typeof __dirname === "string" ? __dirname : path.dirname(fileURLToPath(import.meta.url))
    const pkgPath = path.join(path.dirname(dirname), "package.json")
    return JSON.parse(fs.readFileSync(pkgPath, "utf8"))
  } catch (err) {
    console.error(err)
    return {
      name: "eslint-plugin-yaml",
      version: "1.0.3",
    }
  }
}

const pkg = getPackageJson()

// it seems mark can be undefined issue #67
type LoadYamlException = {
  message: string
  mark?: { buffer: string; line: number; column: number }
}

/** Content -> value | errors */
type LoadYamlValue = {
  value: unknown[]
  errors: Linter.LintMessage[]
}
const values = new Map<string, LoadYamlValue>()

/** Parser for YAML files. */
const parser: Linter.ParserModule = {
  parseForESLint(code: string, options?: any): Linter.ESLintParseResult {
    const ast: AST.Program = {
      type: "Program",
      body: [],
      sourceType: "script",
      tokens: [],
      comments: [],
      range: [0, code.length],
      loc: {
        start: { line: 1, column: 0 },
        end: {
          line: code.split("\n")?.length ?? 1,
          column: code.split("\n")?.slice(-1)?.[0]?.length ?? 0,
        },
      },
    }

    try {
      const yamlValue = loadYaml(code, options?.filename)
      const statement: estree.ExpressionStatement = {
        type: "ExpressionStatement",
        expression: valueToEstree(yamlValue),
      }
      ast.body.push(statement)
      values.set(code, {
        value: yamlValue,
        errors: [],
      })
    } catch (err) {
      const { message, mark } = err as LoadYamlException
      values.set(code, {
        value: [],
        errors: [
          {
            ruleId: "invalid-yaml",
            severity: 2,
            message,
            source: mark?.buffer,
            line: mark?.line ?? 0,
            column: mark?.column ?? 0,
          },
        ],
      })
    }

    return { ast }
  },
}

function isYaml(fileName: string) {
  const fileExtension = path.extname(fileName)
  return [".yaml", ".yml"].includes(fileExtension)
}

function postprocess(_messages: Linter.LintMessage[][], fileName: string): Linter.LintMessage[] {
  if (!isYaml(fileName)) {
    return []
  }

  // takes a Message[][] and filename
  // `messages` argument contains two-dimensional array of Message objects
  // where each top-level array item contains array of lint messages related
  // to the text that was returned in array from preprocess() method

  /*
   * YAML Lint by Validation
   */
  let linter_messages: Linter.LintMessage[] = []

  const value = values.get(fileName)
  if (value === undefined) {
    // not parsed
    values.delete(fileName)
    return []
  }

  if (value.errors.length > 0) {
    values.delete(fileName)
    return value.errors
  }

  /*
   * YAML Lint via JSON
   */
  const errors = value.value.flatMap((yamlDoc) => lintJSON(yamlDoc))
  linter_messages = errors.map((error) => {
    const { reason, evidence, line, character } = error
    return {
      ruleId: "bad-yaml",
      severity: 2,
      message: reason,
      source: evidence,
      line,
      column: character,
    }
  })

  values.delete(fileName)
  // need to return a one-dimensional array of the messages you want to keep
  return linter_messages
}

/** Use js-yaml for reading the yaml file */
function loadYaml(fileContent: string, fileName?: string): unknown[] {
  // Get document, or throw exception on error
  return loadAll(fileContent, undefined, {
    filename: fileName,
    json: false,
  })
}

/** YAML Lint via JSON (converting to json and linting using jshint) */
function lintJSON(yamlDoc: LoadYamlValue["value"][0]): JsHintLintErrors[] {
  const yaml_json = JSON.stringify(yamlDoc, null, 2)
  jshint(yaml_json)
  const data = jshint.data()
  const errors = data?.errors ?? []
  return errors
}

const processors = {
  // add your processors here
  [pkg.name]: {
    meta: {
      name: pkg.name,
      version: pkg.version,
    },
    postprocess,
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
    recommended: {} as Linter.FlatConfig,
    legacy: {} as Linter.Config,
  },
} satisfies ESLint.Plugin

const recommendedConfig: Linter.FlatConfig = {
  name: `${pkg.name}/recommended}`,
  files: ["**/*.yaml", "**/*.yml", "!**/node_modules/**", "!**/pnpm-lock.yaml", "**/.github/**.{yml,yaml}"],
  processor: {
    name: pkg.name,
    preprocess: (text, filename) => {
      return [{ text, filename }]
    },
    postprocess,
  },
  plugins: {
    [pkg.name]: plugin,
  },
  languageOptions: {
    parser,
  },
}

plugin.configs.recommended = recommendedConfig

const legacyConfig: Linter.Config = {
  overrides: [
    {
      plugins: [pkg.name],
      files: ["**/*.yml", "**/*.yaml", "!**/node_modules/**", "!**/pnpm-lock.yaml", "**/.github/**.{yml,yaml}"],
      processor: `yaml/${pkg.name}`,
    },
  ],
}

plugin.configs.legacy = legacyConfig

export default plugin
