//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { safeLoad } from "js-yaml"
import { Linter } from "eslint"
import LintMessage = Linter.LintMessage

const jshint = require("jshint").JSHINT

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

