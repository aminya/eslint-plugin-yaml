const pluginYaml = require("./dist/index.cjs")

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [pluginYaml.configs.recommended]
