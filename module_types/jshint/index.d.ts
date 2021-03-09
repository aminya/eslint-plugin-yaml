// Type definitions for jshint 2.12
// Project: http://jshint.com/
// Definitions by: Amin Yahyaabadi <https://github.com/me>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/* eslint-disable @typescript-eslint/no-unused-vars */

interface LintError {
  id: string
  raw: string
  code: string
  evidence: string
  line: number
  character: number
  scope: string
  reason: string
  [key: string]: any
}

type LintOptions = Record<string, any>

interface LintFunction {
  name: string
  param: any
  line: number
  character: number
  last: number
  lastcharacter: number
  metrics: {
    complexity: number
    parameters: number
    statements: number
  }
}

interface LintUnused {
  name: string
  line: number
  character: number
}

interface LintData {
  functions: LintFunction[]
  options: LintOptions
  errors: LintError[]
  globals: string[]
  unused: LintUnused[]
  member: any
  implieds: any
  /* istanbul ignore next */
  json: any
}

/**
 * @param source The input JavaScript source code.
 * Type: string or an array of strings (each element is interpreted as a newline)
 * @example: `JSHINT(["'use strict';", "console.log('hello, world!');"]);`
 *
 * @param options The linting options to use when analyzing the source code.
 * Type: an object whose property names are the desired options to use and whose property values are the configuration values for those properties.
 * @example: `JSHINT(mySource, { undef: true });`
 *
 * @param predef variables defined outside of the current file; the behavior of this argument is identical to the globals linting option.
 * Type: an object whose property names are the global variable identifiers and whose property values control whether each variable should be considered read-only
 * @example: `JSHINT(mySource, myOptions, { jQuery: false });`
*/
export function JSHINT(source: string | string[], options?: LintOptions, predef?: Record<string, boolean>): LintError[];

export namespace JSHINT {
  /** An array of warnings and errors generated by the most recent invocation of JSHINT. */
  const errors: LintError[];

  /** Generate a report containing details about the most recent invocation of JSHINT. */
  function data(): LintData;

  function addModule(func: any): void;

  // Circular reference from jshint.JSHINT
  const jshint: typeof JSHINT;
}
