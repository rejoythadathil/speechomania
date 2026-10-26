import js from '@eslint/js'
import globals from 'globals'

const noComments = {
  meta: { type: 'problem', messages: { found: 'Comments are not allowed. Put the reason in .notes instead.' } },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type === 'Shebang') continue
          context.report({ loc: comment.loc, messageId: 'found' })
        }
      }
    }
  }
}

export default [
  { ignores: ['node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node, Bun: 'readonly' } },
    plugins: { speechomania: { rules: { 'no-comments': noComments } } },
    rules: {
      'speechomania/no-comments': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  }
]
