module.exports = {
  overrides: [
    {
      files: ["**/*.yaml", "**/*.yml"],
      plugins: ["yaml"],
      extends: ["plugin:yaml/legacy"],
    },
  ],
}
