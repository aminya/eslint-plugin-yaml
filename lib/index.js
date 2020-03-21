"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = require("js-yaml");
const eslint_1 = require("eslint");
const linter = new eslint_1.Linter();
const ESLintConfig = {
    extends: ["plugin:json/recommended-with-comments"],
    plugins: ["json"],
};
const fileContents = {};
function preprocess(text, fileName) {
    fileContents[fileName] = text;
    return [{ text: text, filename: fileName }];
}
function postprocess(messages, fileName) {
    let doc;
    try {
        doc = js_yaml_1.safeLoad(fileContents[fileName], {
            filename: fileName,
            json: false
        });
    }
    catch (e) {
        return [
            {
                ruleId: "invalid-yaml",
                severity: 2,
                message: e.message,
                source: e.mark.buffer,
                line: e.mark.line,
                column: e.mark.column
            }
        ];
    }
    delete fileContents[fileName];
    const yaml_json = JSON.stringify(doc, null, 2);
    const linter_messages = linter.verify(yaml_json, ESLintConfig, { filename: fileName });
    return linter_messages;
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
};
