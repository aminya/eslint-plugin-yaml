import { Linter, AST, SourceCode, Scope } from "eslint"
import type { File, Language, ParseResult, LanguageOptions, LanguageContext, OkParseResult } from "@eslint/core"
import type * as estree from "estree"
import { valueToEstree } from "estree-util-value-to-estree"
import { loadAll, YAMLException } from "js-yaml"
import { type LintError as JsHintLintErrors, JSHINT as jshint } from "jshint"
import path from "path"

// it seems mark can be undefined issue #67
type LoadYamlValue = {
  value: unknown[]
  messages: Linter.LintMessage[]
}

type Path = string

export type YamlLanguageOptions = {}

export class YamlLang implements Language {
  public fileType = "text" as const
  public lineStart = 0 as const
  public columnStart = 0 as const
  public nodeTypeKey = "yaml" as const

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

  public createSourceCode(
    file: File,
    input: OkParseResult<AST.Program>,
    _context: LanguageContext<YamlLanguageOptions>,
  ): SourceCode {
    if (typeof file.body !== "string") {
      throw new Error("File body is not a string")
    }

    return new SourceCode({
      text: file.body,
      ast: input.ast,
      scopeManager: input.scopeManager,
    })
  }

  public validateLanguageOptions(_languageOptions: LanguageOptions): void { }

  /** Parser for YAML files. */
  public parse(file: File, _context: LanguageContext<YamlLanguageOptions>): ParseResult<estree.Program> {
    const path = file.physicalPath || file.path
    if (!this.isYaml(path) || typeof file.body !== "string") {
      return {
        ok: false,
        errors: [],
      }
    }

    // initialize AST
    const ast: AST.Program = {
      type: "Program",
      body: [],
      sourceType: "module",
      tokens: [],
      comments: [],
      range: [0, file.body.length],
      loc: {
        start: { line: 1, column: 0 },
        end: {
          line: file.body.split("\n")?.length ?? 1,
          column: file.body.split("\n")?.slice(-1)?.[0]?.length ?? 0,
        },
      },
    }

    try {
      // load YAML
      const { yamlDocs, warnings } = this.loadYaml(file.body, path)

      // build AST
      const statement: estree.ExpressionStatement = {
        type: "ExpressionStatement",
        expression: valueToEstree(yamlDocs),
      }
      ast.body.push(statement)

      // save warnings for postprocess
      this.parsedFiles.set(file.physicalPath, {
        value: yamlDocs,
        messages: warnings.map((warning): Linter.LintMessage => {
          return {
            ruleId: warning.name,
            severity: 1,
            message: `${warning.name}: ${warning.message} ${warning.reason}`,
            line: warning.mark?.line ?? 0,
            column: warning.mark?.column ?? 0,
          }
        }),
      })

      const scope: Scope.Scope = {
        type: "module",
        isStrict: false,
        upper: null,
        childScopes: [],
        variables: [],
        set: new Map(),
        through: [],
        block: ast,
        references: [],
        functionExpressionScope: false,
        // @ts-expect-error
        variableScope: null,
      }
      // scope.variableScope = scope
      const scopeManager: Scope.ScopeManager = {
        scopes: [scope],
        globalScope: scope,
        acquire: () => scope,
        getDeclaredVariables: () => [],
      }

      return {
        ok: true,
        ast,
        scopeManager,
      }
    } catch (err) {
      if (err instanceof YAMLException) {
        return {
          ok: false,
          errors: [
            {
              message: `${err.name}: ${err.message} ${err.reason}`,
              line: err.mark?.line ?? 0,
              endLine: err.mark?.line ?? 0,
              column: err.mark?.column ?? 0,
            },
          ],
        }
      }

      return {
        ok: false,
        errors: [
          {
            message: String(err),
            line: 0,
            endLine: 0,
            column: 0,
          },
        ],
      }
    }
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
