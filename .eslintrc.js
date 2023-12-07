const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  extends: ['@react-native-community', 'prettier'],
  plugins: ['prettier'],
  root: true,
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true,
      },
    ],
    'prefer-const': 'warn',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    // General
    indent: [
      OFF,
      2,
      {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        FunctionDeclaration: {
          parameters: 1,
          body: 1,
        },
        FunctionExpression: {
          parameters: 1,
          body: 1,
        },
        flatTernaryExpressions: true,
        offsetTernaryExpressions: true,
      },
    ],
    'global-require': OFF,
    'no-plusplus': OFF,
    'no-cond-assign': OFF,
    'max-classes-per-file': [ERROR, 10],
    'no-shadow': OFF,
    'no-undef': OFF,
    'no-bitwise': OFF,
    'no-param-reassign': OFF,
    'no-use-before-define': OFF,
    'linebreak-style': [ERROR, 'unix'],
    semi: [ERROR, 'always'],
    'object-curly-spacing': [ERROR, 'always'],
    'eol-last': [ERROR, 'always'],
    'no-console': OFF,
    'no-restricted-syntax': [
      WARN,
      {
        selector:
          "CallExpression[callee.object.name='console'][callee.property.name!=/^(warn|error|info|trace|disableYellowBox|tron)$/]",
        message: 'Unexpected property on console object was called',
      },
    ],
    eqeqeq: [WARN, 'always'],
    quotes: [
      ERROR,
      'single',
      { avoidEscape: true, allowTemplateLiterals: false },
    ],
    // typescript
    '@typescript-eslint/no-shadow': [ERROR],
    '@typescript-eslint/no-use-before-define': [ERROR],
    '@typescript-eslint/no-unused-vars': ERROR,
    '@typescript-eslint/consistent-type-definitions': [ERROR, 'interface'],
    '@typescript-eslint/indent': [
      OFF,
      2,
      {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        FunctionDeclaration: {
          parameters: 1,
          body: 1,
        },
        FunctionExpression: {
          parameters: 1,
          body: 1,
        },
        flatTernaryExpressions: true,
        offsetTernaryExpressions: true,
      },
    ],
    // react
    'react/jsx-props-no-spreading': OFF,
    'react/jsx-filename-extension': [
      ERROR,
      { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    ],
    'react/no-unescaped-entities': [ERROR, { forbid: ['>', '"', '}'] }],
    'react/prop-types': [
      ERROR,
      { ignore: ['action', 'dispatch', 'nav', 'navigation'] },
    ],
    'react/display-name': OFF,
    'react/jsx-boolean-value': ERROR,
    'react/jsx-no-undef': ERROR,
    'react/jsx-uses-react': ERROR,
    'react/jsx-sort-props': [
      ERROR,
      {
        callbacksLast: true,
        shorthandFirst: true,
        ignoreCase: true,
        noSortAlphabetically: true,
      },
    ],
    'react/jsx-pascal-case': ERROR,
    'react/no-children-prop': OFF,
    // react-native specific rules
    'react-native/no-unused-styles': ERROR,
    'react-native/no-inline-styles': ERROR,
    'react-native/no-color-literals': ERROR,
    'react-native/no-raw-text': ERROR,
  },
  globals: {
    JSX: 'readonly',
  },
  env: {
    jest: true,
  },
};
