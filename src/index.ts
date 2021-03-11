//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { load } from "js-yaml"

import { JSHINT as jshint } from "jshint"

// types
import { Linter } from "eslint"

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// filename -> fileContent
const fileContents = new Map<string, string>()

function preprocess(text: string, fileName: string) {
    // takes text of the file and filename

    fileContents.set(fileName, text)

    // return an array of code blocks to lint
    return [{ text, filename: fileName }]
}

// @ts-ignore
function postprocess(messages: Linter.LintMessage[][], fileName: string): Linter.LintMessage[] {
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
        // Use js-yaml for reading the yaml file
        // Get document, or throw exception on error
        let doc: ReturnType<typeof load>
        try {
            doc = load(fileContent, {
                filename: fileName,
                json: false,
            })
        } catch (e) {
            const { message, mark } = e as {message: string, mark: {buffer: string, line: number, column: number}}
            return [
                {
                    ruleId: "invalid-yaml",
                    severity: 2,
                    message,
                    source: mark.buffer,
                    line: mark.line,
                    column: mark.column,
                },
            ]
        }

        /*
         * YAML Lint via JSON
         */
        // Converting to json and linting using eslint-json
        const yaml_json = JSON.stringify(doc, null, 2)
        jshint(yaml_json)
        const data = jshint.data()
        const errors = data?.errors ?? []

        linter_messages = errors
            .filter((e) => Boolean(e))
            .map((error) => {
                return {
                    ruleId: "bad-yaml",
                    severity: 2,
                    message: error.reason,
                    source: error.evidence,
                    line: error.line,
                    column: error.character,
                }
            })

        // empty cache
        fileContents.delete(fileName)
    }

    // // you need to return a one-dimensional array of the messages you want to keep
    return linter_messages
}

export const processors = {
    // add your processors here
    ".yml": {
        preprocess,
        postprocess,
    },
    ".yaml": {
        preprocess,
        postprocess,
    },
}

export const configs = {
    recommended: {
        ignorePatterns: ["!.github"],
        overrides: [
            {
                plugins: ["yaml"],
                files: ["*.yaml", "*.yml"],
            },
        ],
    },
}
