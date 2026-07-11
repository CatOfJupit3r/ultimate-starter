import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `https://github.com/startername/startername/tree/main/packages/enumwaii#${ruleName}`,
);

const isRawStringNode = (node: TSESTree.Node): boolean =>
  (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') ||
  (node.type === AST_NODE_TYPES.TemplateLiteral && node.expressions.length === 0);

export const noRawEnumMemberRule = createRule({
  name: 'no-raw-enum-member',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require enumwaii member accessors in derived-map keys and pick/omit member lists',
    },
    messages: {
      rawDerivedKey: 'Do not use the raw enum key {{key}}. Use a computed member key such as [MY_ENUM.{{key}}].',
      rawSubsetMember: 'Do not use the raw enum member {{member}}. Reference the owning enum member instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression || node.callee.computed) {
          return;
        }
        if (node.callee.property.type !== AST_NODE_TYPES.Identifier) {
          return;
        }
        const methodName = node.callee.property.name;
        if (methodName === 'derive') {
          const mapping = node.arguments[0];
          if (mapping?.type !== AST_NODE_TYPES.ObjectExpression) {
            return;
          }
          for (const property of mapping.properties) {
            if (property.type !== AST_NODE_TYPES.Property || property.computed) {
              continue;
            }
            const key = context.sourceCode.getText(property.key);
            context.report({ node: property.key, messageId: 'rawDerivedKey', data: { key } });
          }
          return;
        }

        if (methodName !== 'pick' && methodName !== 'omit') {
          return;
        }
        const members = node.arguments[1];
        if (members?.type !== AST_NODE_TYPES.ArrayExpression) {
          return;
        }
        for (const member of members.elements) {
          if (member && isRawStringNode(member)) {
            context.report({
              node: member,
              messageId: 'rawSubsetMember',
              data: { member: context.sourceCode.getText(member) },
            });
          }
        }
      },
    };
  },
});
