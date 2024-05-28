const pluginYaml = require("../dist/index.cjs")

module.exports = {
  extends: pluginYaml,
  ignorePatterns: ["dist/", "node_modules/"],
}
