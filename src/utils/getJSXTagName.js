function getTagName(path) {
  if (path.isJSXIdentifier()) {
    return path.node.name;
  } else if (path.isJSXMemberExpression()) {
    return `${getTagName(path.get('object'))}.${getTagName(path.get('property'))}`;
  }

  throw new Error('Unsupported path type');
}

export default path => getTagName(path.get('name'));
