const pluginYaml = require("./dist/index.cjs")

module.exports = {
  ...pluginYaml.configs.recommended,
}
