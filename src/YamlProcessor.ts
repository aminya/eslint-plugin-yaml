import type { Linter, AST } from "eslint"
import type * as estree from "estree"
import { valueToEstree } from "estree-util-value-to-estree"
import { loadAll } from "js-yaml"
import { type LintError as JsHintLintErrors, JSHINT as jshint } from "jshint"
import path from "path"

// it seems mark can be undefined issue #67
type LoadYamlException = {
  message: string
  mark?: { buffer: string; line: number; column: number }
}
type LoadYamlValue = {
  value: unknown[]
  errors: Linter.LintMessage[]
}
export class YamlProcessor {
  private values = new Map<string, LoadYamlValue>()

  /** Parser for YAML files. */
  public parseForESLint(code: string, options?: { filePath?: string }): Linter.ESLintParseResult {
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
      const yamlValue = this.loadYaml(code, options?.filePath)
      const statement: estree.ExpressionStatement = {
        type: "ExpressionStatement",
        expression: valueToEstree(yamlValue),
      }
      ast.body.push(statement)
      this.values.set(code, {
        value: yamlValue,
        errors: [],
      })
    } catch (err) {
      const { message, mark } = err as LoadYamlException
      const key = options?.filePath ?? code
      this.values.set(key, {
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
  }

  public preprocess(text: string, filename: string) {
    return [{ text, filename }]
  }

  public postprocess(_messages: Linter.LintMessage[][], filePath: string): Linter.LintMessage[] {
    if (!this.isYaml(filePath)) {
      return []
    }

    let value = this.values.get(filePath)
    if (value === undefined) {
      // search all the keys that end with filePath
      const key = Array.from(this.values.keys()).find((key) => key.endsWith(filePath))
      if (key === undefined) {
        return [] // no value found
      }
      value = this.values.get(key)!
    }

    if (value.errors.length > 0) {
      this.values.delete(filePath)
      return value.errors
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

    this.values.delete(filePath)
    return linter_messages
  }

  private isYaml(fileName: string) {
    const fileExtension = path.extname(fileName)
    return [".yaml", ".yml"].includes(fileExtension)
  }

  private loadYaml(fileContent: string, fileName?: string): unknown[] {
    return loadAll(fileContent, undefined, {
      filename: fileName,
      json: false,
    })
  }

  private lintJSON(yamlDoc: LoadYamlValue["value"][0]): JsHintLintErrors[] {
    const yaml_json = JSON.stringify(yamlDoc, null, 2)
    jshint(yaml_json)
    const data = jshint.data()
    const errors = data?.errors ?? []
    return errors
  }
}
