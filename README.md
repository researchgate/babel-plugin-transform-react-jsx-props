# babel-plugin-transform-react-jsx-props

Adds additional props to jsx snippets.

## Example

###In

```
<sometag />
```
###Out

```
<sometag prop="string" />
```

## Installation

```sh
$ npm install babel-plugin-transform-react-jsx-props
```

## Usage

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: [["transform-react-jsx-props", options]]
});
```
