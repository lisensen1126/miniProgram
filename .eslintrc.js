// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: [
    'standard',
    'plugin:promise/recommended',
    'plugin:import/recommended',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  // globals
  globals: {
    __DEV__: true,
    App: true,
    Page: true,
    wx: true,
    getApp: true,
    Component: true,
    Behavior: true,
  },
  settings: {
    'import/resolver': {
      webpack: {
        'config': 'webpack.config.babel.js',
      },
    },
  },
  // add your custom rules here
  rules: {
    // always allow new operator
    'no-new': 0,
    // always add dangling comma for multine
    'comma-dangle': [1, 'always-multiline'],
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // disallow multiple empty lines
    'no-multiple-empty-lines': ['error', {max: 2, maxEOF: 1}],
    // allow customized promise parameter names
    'promise/param-names': 'off',
    "quotes" : ['error', 'single', {allowTemplateLiterals: false}],
    // from boilerplate
    'import/no-absolute-path': 2,
    'import/no-extraneous-dependencies': 2,
    'import/no-mutable-exports': 2,
    'import/newline-after-import': 1,
    'import/unambiguous': 0,
    'promise/avoid-new': 0,
    'promise/no-callback-in-promise': 0,
    'promise/always-return': 0,
    // enforce the consistent use of either backticks, double, or single quotes
    'quotes' : ['error', 'single', {allowTemplateLiterals: false}],
  },
}
