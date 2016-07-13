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

## Usage

Add `yaml` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "yaml"
    ]
}
```

You can run ESLint on individual YAML files or you can use the `--ext` flag to add YAML files to the list.

```
eslint . --ext .yaml --ext .js
eslint example.yaml
```
