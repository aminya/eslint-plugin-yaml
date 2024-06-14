import { loadAll } from "js-yaml"
import { JSHINT as jshint, type LintError as JsHintLintErrors } from "jshint"
import type { Linter, ESLint } from "eslint"
import pkg from "../package.json"

/*
██    ██ ████████ ██ ██      ███████
██    ██    ██    ██ ██      ██
██    ██    ██    ██ ██      ███████
██    ██    ██    ██ ██           ██
 ██████     ██    ██ ███████ ███████
*/

// filename -> fileContent
const fileContents = new Map<string, string>()

/** Takes text of the file and filename */
function cacheYaml(fileName: string, text: string) {
  fileContents.set(fileName, text)
}

type LoadYamlValue = unknown[]
// it seems mark can be undefined issue #67
type LoadYamlException = {
  message: string
  mark?: { buffer: string; line: number; column: number }
}

/** Use js-yaml for reading the yaml file */
function loadYaml(fileContent: string, fileName: string): LoadYamlValue {
  // Get document, or throw exception on error
  return loadAll(fileContent, undefined, {
    filename: fileName,
    json: false,
  })
}

/** YAML Lint via JSON (converting to json and linting using jshint) */
function lintJSON(yamlDoc: LoadYamlValue[0]): JsHintLintErrors[] {
  const yaml_json = JSON.stringify(yamlDoc, null, 2)
  jshint(yaml_json)
  const data = jshint.data()
  const errors = data?.errors ?? []
  return errors
}

/*
███████ ██   ██ ██████   ██████  ██████  ████████ ███████
██       ██ ██  ██   ██ ██    ██ ██   ██    ██    ██
█████     ███   ██████  ██    ██ ██████     ██    ███████
██       ██ ██  ██      ██    ██ ██   ██    ██         ██
███████ ██   ██ ██       ██████  ██   ██    ██    ███████
*/

function preprocess(text: string, fileName: string) {
  cacheYaml(fileName, text)

  // return an array of code blocks to lint
  return [{ text, filename: fileName }]
}

function postprocess(_messages: Linter.LintMessage[][], fileName: string): Linter.LintMessage[] {
  // takes a Message[][] and filename
  // `messages` argument contains two-dimensional array of Message objects
  // where each top-level array item contains array of lint messages related
  // to the text that was returned in array from preprocess() method

  /*
   * YAML Lint by Validation
   */
  let linter_messages: Linter.LintMessage[] = []

  const fileContent = fileContents.get(fileName)
  if (fileContent !== undefined) {
    // Get document, or throw exception on error
    let yamlDocs: LoadYamlValue | undefined
    try {
      yamlDocs = loadYaml(fileContent, fileName)
    } catch (e) {
      const { message, mark } = e as LoadYamlException
      return [
        {
          ruleId: "invalid-yaml",
          severity: 2,
          message,
          source: mark?.buffer,
          line: mark?.line ?? 0,
          column: mark?.column ?? 0,
        },
      ]
    }
    // at this point yamlDocs is defined

    /*
     * YAML Lint via JSON
     */
    const errors = yamlDocs.flatMap((yamlDoc) => lintJSON(yamlDoc))
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

    // empty cache
    fileContents.delete(fileName)
  }

  // // you need to return a one-dimensional array of the messages you want to keep
  return linter_messages
}

const processors = {
  // add your processors here
  yaml: {
    meta: {
      name: pkg.name,
      version: pkg.version,
    },
    preprocess,
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
  configs: {},
} satisfies ESLint.Plugin

plugin.configs = {
  recommended: {
    name: "eslint-plugin-yaml-recommended",
    files: ["**/*.{yaml,yaml}", "!**/node_modules/**", "!**/pnpm-lock.yaml", "**/.github/**.{yml,yaml}"],
    processor: {
      preprocess,
      postprocess,
    },
    plugins: {
      yaml: plugin,
    },
  },
  "recommended-legacy": {
    plugins: ["yaml"],
    ignorePatterns: ["!.github"],
    overrides: [
      {
        files: ["**/*.{yaml,yml}"],
        processor: "yaml",
      },
    ],
  },
} as { recommended: Linter.FlatConfig } satisfies ESLint.Plugin["configs"]

export default plugin
module.exports = plugin
