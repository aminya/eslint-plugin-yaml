# eslint-plugin-yaml

Lint YAML files

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-yaml`:

```
$ npm install eslint-plugin-yaml --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-yaml` globally.

## Usage - method 1

Add the following to the `overrides` section of `.eslintrc` for yaml files:
```json
"overrides" : [
    {
      "files": ["*.yaml", "*.yml"],
      "plugins": ["yaml"],
      "extends": ["plugin:yaml/recommended"]
    }
]
```
and run it for all the files:
```
eslint . 
```
or:
```
eslint example.yaml
```

See spec folder for an example of eslint config file.

## Usage - method 2

or add `yaml` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "yaml"
    ],
    "extends": ["plugin:yaml/recommended"]
}
```

You can run ESLint on individual YAML files or you can use the `--ext` flag to add YAML files to the list.

```
eslint . --ext .yaml --ext .js
eslint example.yaml
```
