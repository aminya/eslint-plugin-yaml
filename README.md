# eslint-plugin-yaml

Lint YAML files

## Installation

You'll first need to install [ESLint](http://eslint.org):

Next, install `eslint-plugin-yaml`:

```shell
npm install eslint-plugin-yaml --save-dev
```

## Usage

### Eslint 9 and above

Add the following to `eslint.config.cjs`:

```js
const pluginYaml = require("eslint-plugin-yaml").default

module.exports = [pluginYaml.configs.recommended]
```

or to `eslint.config.mjs`:

```js
import pluginYaml from "eslint-plugin-yaml"

export default [pluginYaml.configs.recommended]
```

### Eslint 8 and below

Add the following to the `overrides` section of `.eslintrc` for yaml files:

```json
"overrides" : [
    {
      "files": ["**/*.yaml", "**/*.yml"],
      "plugins": ["yaml"],
      "extends": ["plugin:yaml/legacy"]
    }
]
```

and run it for all the files:

```shell
eslint .
```

or:

```shell
eslint example.yaml
```

See spec folder for an example of eslint config file.

### Eslint 8 and below (alternative)

or add `yaml` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["yaml"],
  "extends": ["plugin:yaml/legacy"]
}
```

You can run ESLint on individual YAML files or you can use the `--ext` flag to add YAML files to the list.

```shell
eslint . --ext .yaml --ext .js
eslint example.yaml
```
