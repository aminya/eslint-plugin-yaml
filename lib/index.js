"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const js_yaml_1 = require("js-yaml")
const jshint = require("jshint").JSHINT
const fileContents = {}
function preprocess(text, fileName) {
    fileContents[fileName] = text
    return [{ text: text, filename: fileName }]
}
function postprocess(messages, fileName) {
    let doc
    try {
        doc = js_yaml_1.safeLoad(fileContents[fileName], {
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
    delete fileContents[fileName]
    const yaml_json = JSON.stringify(doc, null, 2)
    jshint(yaml_json)
    const data = jshint.data()
    const errors = (data && data.errors) || []
    return errors
        .filter(function(e) {
            return !!e
        })
        .map(function(error) {
            return {
                ruleId: "bad-yaml",
                severity: 2,
                message: error.reason,
                source: error.evidence,
                line: error.line,
                column: error.character
            }
        })
}
exports.processors = {
    ".yml": {
        preprocess: preprocess,
        postprocess: postprocess
    },
    ".yaml": {
        preprocess: preprocess,
        postprocess: postprocess
    }
}
