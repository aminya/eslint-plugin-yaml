import type { Linter, AST } from "eslint"
import type * as estree from "estree"
import { valueToEstree } from "estree-util-value-to-estree"
import { loadAll, type YAMLException } from "js-yaml"
import { type LintError as JsHintLintErrors, JSHINT as jshint } from "jshint"
import path from "path"

// it seems mark can be undefined issue #67
type LoadYamlException = {
  message: string
  mark?: { buffer: string; line: number; column: number }
}
type LoadYamlValue = {
  value: unknown[]
  messages: Linter.LintMessage[]
}

type Path = string

export class YamlProcessor implements Linter.Processor<Linter.ProcessorFile> {
  /** Map of file paths to their YAML value and warnings. */
  private parsedFiles = new Map<Path, LoadYamlValue>()

  // TODO: Implement autofix
  public supportsAutofix = false

  /** The preprocess method is called by ESLint before the parser is run. */
  public preprocess(text: string, path: Path): Linter.ProcessorFile[] {
    if (!this.isYaml(path)) {
      return []
    }
    return [{ text, filename: path }]
  }

  /** Parser for YAML files. */
  public parseForESLint(code: string, options?: { filePath?: Path }): Linter.ESLintParseResult {
    // initialize AST
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
      // load YAML
      const { yamlDocs, warnings } = this.loadYaml(code, options?.filePath)

      // build AST
      const statement: estree.ExpressionStatement = {
        type: "ExpressionStatement",
        expression: valueToEstree(yamlDocs),
      }
      ast.body.push(statement)

      // save warnings for postprocess
      this.parsedFiles.set(code, {
        value: yamlDocs,
        messages: warnings.map((warning) => ({
          ruleId: "yaml-warning",
          severity: 2,
          message: warning.message,
          source: warning.mark?.buffer,
          line: warning.mark?.line ?? 0,
          column: warning.mark?.column ?? 0,
        })),
      })
    } catch (err) {
      const { message, mark } = err as LoadYamlException
      const key = options?.filePath ?? code
      this.parsedFiles.set(key, {
        value: [],
        messages: [
          {
            ruleId: "invalid-yaml",
            severity: 2,
            message,
            line: mark?.line ?? 0,
            column: mark?.column ?? 0,
          },
        ],
      })
    }

    return { ast }
  }

  /** The postprocess method is called by ESLint after the parser is run. */
  public postprocess(_messages: Linter.LintMessage[][], filePath: Path): Linter.LintMessage[] {
    if (!this.isYaml(filePath)) {
      return []
    }

    let value = this.parsedFiles.get(filePath)
    if (value === undefined) {
      // search all the keys that end with filePath
      const key = Array.from(this.parsedFiles.keys()).find((key) => key.endsWith(filePath))
      if (key === undefined) {
        return [] // no value found
      }
      value = this.parsedFiles.get(key)!
    }

    if (value.messages.length > 0) {
      this.parsedFiles.delete(filePath)
      return value.messages
    }

    const errors = value.value.flatMap((yamlDoc) => this.lintJSON(yamlDoc))
    const linter_messages: Linter.LintMessage[] = errors.map((error) => {
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

    this.parsedFiles.delete(filePath)
    return linter_messages
  }

  private isYaml(filePath: Path) {
    const fileExtension = path.extname(filePath)
    return [".yaml", ".yml"].includes(fileExtension)
  }

  private loadYaml(fileContent: string, filePath?: Path) {
    const warnings: YAMLException[] = []
    const yamlDocs = loadAll(fileContent, undefined, {
      filename: filePath,
      json: false,
      onWarning: (exception) => {
        warnings.push(exception)
      },
    })
    return { yamlDocs, warnings }
  }

  private lintJSON(yamlDoc: LoadYamlValue["value"][0]): JsHintLintErrors[] {
    const yaml_json = JSON.stringify(yamlDoc, null, 2)
    jshint(yaml_json)
    const data = jshint.data()
    const errors = data?.errors ?? []
    return errors
  }
}
