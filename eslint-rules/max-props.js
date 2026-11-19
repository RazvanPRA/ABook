/**
 * local/max-props — `modular-architecture` §2: at most N props per component (default 7).
 *
 * Counts:
 *  - own members of an interface or type literal whose name ends in `Props`
 *    (members of an intersection's literal parts are summed; referenced/extended types are not
 *    expanded, so `extends PressableProps` does not count against the component);
 *  - properties of the destructured first parameter of a PascalCase function (the component).
 * Rest elements (`...rest`) are not counted.
 */
const DEFAULT_MAX = 7;

const isPropsName = name => typeof name === 'string' && /Props$/.test(name);
const isComponentName = name => typeof name === 'string' && /^[A-Z]/.test(name);

const literalMemberCount = typeNode => {
  if (!typeNode) {
    return 0;
  }
  if (typeNode.type === 'TSTypeLiteral') {
    return typeNode.members.length;
  }
  if (typeNode.type === 'TSIntersectionType') {
    return typeNode.types.reduce((n, t) => n + literalMemberCount(t), 0);
  }
  return 0;
};

const functionName = node => {
  if (node.id) {
    return node.id.name;
  }
  const parent = node.parent;
  if (parent && parent.type === 'VariableDeclarator' && parent.id) {
    return parent.id.name;
  }
  return undefined;
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Limit the number of props per component.' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: {
      tooMany:
        '{{name}} has {{count}} props (max {{max}}). Group related props into an object or split the component.',
    },
  },
  create(context) {
    const max = (context.options[0] && context.options[0].max) || DEFAULT_MAX;
    const check = (node, name, count) => {
      if (count > max) {
        context.report({
          node,
          messageId: 'tooMany',
          data: { name, count, max },
        });
      }
    };
    const checkComponent = node => {
      const name = functionName(node);
      const [first] = node.params;
      if (!isComponentName(name) || !first || first.type !== 'ObjectPattern') {
        return;
      }
      const count = first.properties.filter(p => p.type === 'Property').length;
      check(first, name, count);
    };
    return {
      TSInterfaceDeclaration(node) {
        if (isPropsName(node.id.name)) {
          check(node.id, node.id.name, node.body.body.length);
        }
      },
      TSTypeAliasDeclaration(node) {
        if (isPropsName(node.id.name)) {
          check(node.id, node.id.name, literalMemberCount(node.typeAnnotation));
        }
      },
      FunctionDeclaration: checkComponent,
      ArrowFunctionExpression: checkComponent,
      FunctionExpression: checkComponent,
    };
  },
};
