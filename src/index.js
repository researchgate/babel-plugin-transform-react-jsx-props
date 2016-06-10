/* @flow */
/* eslint-disable no-param-reassign */
import { parse } from 'babylon';
import { cloneDeep } from 'babel-types';
import getJSXTagName from './utils/getJSXTagName';
import unquote from 'unquote';

function parseExpression(code: string, t: Object): Object {
  const result = parse(`x = ${code}`, { sourceType: 'script', plugins: ['jsx'] });

  let node = cloneDeep(result.program.body[0].expression.right);

  // Everything besides strings gets wrapped in an expression container
  if (!t.isStringLiteral(node)) {
    node = t.jSXExpressionContainer(node);
  }

  return node;
}

function pushPropsToJSXElement(props: { [key: string]: string }, path: Object, t: Object): void {
  Object.keys(props).forEach(prop => {
    const propValue = props[prop];

    if (typeof propValue !== 'string') {
      throw new Error(
        `The value for prop "${prop}" is not a string. (e.g "3" => 3, "'3'" => '3', ...)`
      );
    }

    if (prop === 'children') {
      // we need to handle children in a special way
      const isText = path.parentPath.get('children').every(childPath => childPath.isJSXText());

      if (isText) {
        path.parentPath.node.children = [t.jSXText(unquote(propValue))];

        // If it was a self-closing tag make it a non-self-closing one
        if (path.node.selfClosing === true) {
          path.node.selfClosing = false;
          path.parentPath.node.closingElement = t.jSXClosingElement(cloneDeep(path.node.name));
        }
      }

      return;
    }

    const id = t.jSXIdentifier(prop);
    const value = parseExpression(propValue, t);

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
export default function ({ types }: Object): { visitor: { [key: string]: Function } } {
  const visitor = {
    JSXOpeningElement(path: Object, state: Object): void {
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
