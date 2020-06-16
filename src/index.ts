//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { safeLoad } from "js-yaml"
import {JSHINT as jshint} from "jshint"

// types
import { Linter } from "eslint"

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

const fileContents: { [x: string]: string } = {}

function preprocess(text: string, fileName: string) {
    // takes text of the file and filename

    fileContents[fileName] = text

    // return an array of code blocks to lint
    return [{ text: text, filename: fileName }]
}

function postprocess(messages:  Linter.LintMessage[][], fileName: string) {
    // takes a Message[][] and filename
    // `messages` argument contains two-dimensional array of Message objects
    // where each top-level array item contains array of lint messages related
    // to the text that was returned in array from preprocess() method

    /*
     * YAML Lint by Validation
     */

    // Use js-yaml for reading the yaml file
    // Get document, or throw exception on error
    let doc
    try {
        doc = safeLoad(fileContents[fileName], {
            filename: fileName,
            json: false
        })
    } catch (e) {
        return [
            {
                ruleId: "invalid-yaml",
                severity: 2,
                message: e.message,
                source: e.mark.buffer,
                line: e.mark.line,
                column: e.mark.column
            }
        ]
    }

    /*
     * YAML Lint via JSON
     */
    // Converting to json and linting using eslint-json
    const yaml_json = JSON.stringify(doc, null, 2)
    jshint(yaml_json)
    const data = jshint.data()
    const errors = (data && data.errors) || []

    const linter_messages = errors
        .filter(function(e) {
            return !!e
        }).map(function(error) {
            return {
                ruleId: "bad-yaml",
                severity: 2,
                message: error.reason,
                source: error.evidence,
                line: error.line,
                column: error.character
            }
        })

    // // you need to return a one-dimensional array of the messages you want to keep
    return linter_messages
}

export const processors = {
    // add your processors here
    ".yml": {
        preprocess: preprocess,
        postprocess: postprocess
    },
    ".yaml": {
        preprocess: preprocess,
        postprocess: postprocess
    }
}

export const configs = {
    recommended: {
        overrides:[{
            plugins: ['yaml'],
            "files": ["*.yaml", "*.yml", ".github/workflows/*.yml", ".github/workflows/*.yaml"],
        }]
    },
}
