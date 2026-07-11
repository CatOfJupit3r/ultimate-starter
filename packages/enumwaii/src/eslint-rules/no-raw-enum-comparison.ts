import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import type { Type } from 'typescript';

const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `https://github.com/startername/startername/tree/main/packages/enumwaii#${ruleName}`,
);

const COMPARISON_OPERATORS = new Set(['==', '===', '!=', '!==']);

/**
 * The brand property is declared as a computed unique-symbol key, which the
 * checker names `__@ENUMWAII_BRAND@<id>`; matching on the symbol name is the
 * only structural handle the brand exposes.
 */
const doesTypeCarryBrand = (type: Type): boolean => {
  if (type.isUnion()) {
    return type.types.some((member) => doesTypeCarryBrand(member));
  }
  return type.getProperties().some((property) => String(property.escapedName).includes('ENUMWAII_BRAND'));
};

const isRawStringNode = (node: TSESTree.Node): boolean =>
  (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') ||
  (node.type === AST_NODE_TYPES.TemplateLiteral && node.expressions.length === 0);

export const noRawEnumComparisonRule = createRule({
  name: 'no-raw-enum-comparison',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow comparing enumwaii values against raw string literals; the branded type cannot catch this because TypeScript treats the types as comparable',
    },
    messages: {
      rawComparison:
        'Do not compare an enumwaii value with the raw string {{literal}}. Reference the enum member (MY_ENUM.enum.{{member}}) or use .is()/.parse().',
      rawSwitchCase:
        'Do not switch over an enumwaii value with the raw case {{literal}}. Reference the enum member (MY_ENUM.enum.{{member}}) instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);

    const isEnumwaiiExpression = (node: TSESTree.Node): boolean => doesTypeCarryBrand(services.getTypeAtLocation(node));

    const reportRawNode = (rawNode: TSESTree.Node, messageId: 'rawComparison' | 'rawSwitchCase') => {
      const literal = context.sourceCode.getText(rawNode);
      context.report({
        node: rawNode,
        messageId,
        data: { literal, member: literal.replaceAll(/['"`]/gu, '') },
      });
    };

    return {
      BinaryExpression(node) {
        if (!COMPARISON_OPERATORS.has(node.operator) || node.left.type === AST_NODE_TYPES.PrivateIdentifier) {
          return;
        }
        if (isRawStringNode(node.left) && isEnumwaiiExpression(node.right)) {
          reportRawNode(node.left, 'rawComparison');
        } else if (isRawStringNode(node.right) && isEnumwaiiExpression(node.left)) {
          reportRawNode(node.right, 'rawComparison');
        }
      },
      SwitchStatement(node) {
        if (!isEnumwaiiExpression(node.discriminant)) {
          return;
        }
        for (const switchCase of node.cases) {
          if (switchCase.test && isRawStringNode(switchCase.test)) {
            reportRawNode(switchCase.test, 'rawSwitchCase');
          }
        }
      },
    };
  },
});
