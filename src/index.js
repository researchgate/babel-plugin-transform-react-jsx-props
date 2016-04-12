import { parse } from 'babylon';
import { cloneDeep } from 'babel-types';
import getJSXTagName from './utils/getJSXTagName';

function parseExpression(code) {
  const result = parse('x = ' + JSON.stringify(code), { sourceType: "script", plugins: ['jsx'] });

  return cloneDeep(result.program.body[0].expression.right);
}

function pushPropsToJSXElement(props, node, t) {
  for (const prop in props) {
    let value;
    const propValue = props[prop];

    const id = t.jSXIdentifier(prop);
    switch (typeof propValue) {
      case 'string':
        value = t.stringLiteral(propValue);
        break;
      case 'number':
        value = t.jSXExpressionContainer(t.numericLiteral(propValue));
        break;
      case 'boolean':
        value = t.jSXExpressionContainer(t.booleanLiteral(propValue));
        break;
      default:
        value = t.jSXExpressionContainer(parseExpression(propValue, node.loc.line));
    }
    node.attributes.push(t.jSXAttribute(id, value));
  }
}

export { getJSXTagName };

/**
 * This adds additional props to a jsx snippet
 */
export default function ({ types }) {
  let visitor = {
    JSXOpeningElement(path, state) {
      if (!state.opts) return;
      state.countTags = state.countTags || {};

      const tagName = getJSXTagName(path);
      const tagIndex = state.countTags[tagName] = state.countTags[tagName] || 0;
      state.countTags[tagName]++;

      if (!state.opts[tagName] || !state.opts[tagName][tagIndex]) return;

      const props = state.opts[tagName][tagIndex];

      pushPropsToJSXElement(props, path.node, types);
    }
  };

  return {
    visitor
  };
}
