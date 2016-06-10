/* eslint-disable no-param-reassign */
import { parse } from 'babylon';
import { cloneDeep } from 'babel-types';
import getJSXTagName from './utils/getJSXTagName';

function parseExpression(code) {
  const result = parse(`x = ${JSON.stringify(code)}`, { sourceType: 'script', plugins: ['jsx'] });

  return cloneDeep(result.program.body[0].expression.right);
}

function pushPropsToJSXElement(props, path, t) {
  Object.keys(props).forEach(prop => {
    let value;
    const propValue = props[prop];

    if (prop === 'children') {
      // we need to handle children in a special way
      const isText = path.parentPath.get('children').every(childPath => childPath.isJSXText());

      if (isText && typeof propValue === 'string') {
        path.parentPath.node.children = [t.jSXText(propValue)];

        // If it was a self-closing tag make it a non-self-closing one
        if (path.node.selfClosing === true) {
          path.node.selfClosing = false;
          path.parentPath.node.closingElement = t.jSXClosingElement(cloneDeep(path.node.name));
        }
      }

      return;
    }

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
        value = t.jSXExpressionContainer(parseExpression(propValue, path.node.loc.line));
    }

    const attribute = t.jSXAttribute(id, value);

    const attributeIndex = path.node.attributes.findIndex(attr => attr.name.name === prop);
    if (attributeIndex > -1) {
      path.node.attributes[attributeIndex] = attribute;
    } else {
      path.node.attributes.push(attribute);
    }
  });
}

export { getJSXTagName };

/**
 * This adds additional props to a jsx snippet
 */
export default function ({ types }) {
  const visitor = {
    JSXOpeningElement(path, state) {
      if (!state.opts) return;
      state.countTags = state.countTags || {};

      const tagName = getJSXTagName(path);
      const tagIndex = state.countTags[tagName] = state.countTags[tagName] || 0;
      state.countTags[tagName]++;

      if (!state.opts[tagName] || !state.opts[tagName][tagIndex]) return;

      const props = state.opts[tagName][tagIndex];

      pushPropsToJSXElement(props, path, types);
    },
  };

  return {
    visitor,
  };
}
