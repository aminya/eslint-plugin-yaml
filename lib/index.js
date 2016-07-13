"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var jshint = require("jshint").JSHINT;
var yaml = require("js-yaml");

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

var fileContents = {};

function onPreprocess(text, fileName) {
    fileContents[fileName] = text;
    return [text];
}

function onPostprocess(messages, fileName) {
    // Get document, or throw exception on error
    var doc;
    try {
        doc = yaml.safeLoad(fileContents[fileName], {
            filename: fileName,
            json: false
        });
    } catch (e) {
        return [{
            ruleId: "invalid-yaml",
            severity: 2,
            message: e.message,
            source: e.mark.buffer,
            line: e.mark.line,
            column: e.mark.column
        }];
    }

    jshint(JSON.stringify(doc, null, 2));
    delete fileContents[fileName];

    var data = jshint.data();
    var errors = (data && data.errors) || [];

    return errors.filter(function(e) {
        return !!e;
    }).map(function(error) {
        return {
            ruleId: "bad-yaml",
            severity: 2,
            message: error.reason,
            source: error.evidence,
            line: error.line,
            column: error.character
        };
    });
}

// import processors
module.exports.processors = {
    // add your processors here
    ".yml": {
        preprocess: onPreprocess,
        postprocess: onPostprocess
    },
    ".yaml": {
        preprocess: onPreprocess,
        postprocess: onPostprocess
    }
};
