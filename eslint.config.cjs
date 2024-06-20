const pluginYaml = require("eslint-plugin-yaml").default

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [pluginYaml.configs.recommended]
