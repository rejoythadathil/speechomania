import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

const noComments = {
  meta: { type: 'problem', messages: { found: 'Comments are not allowed. Put the reason in .notes instead.' } },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) context.report({ loc: comment.loc, messageId: 'found' })
      }
    }
  }
}

const boardUiPaths = ['@/components/base/*', '@/components/foundations/*', '@/components/base/**', '@/components/foundations/**']

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { 'react-hooks': reactHooks, speechomania: { rules: { 'no-comments': noComments } } },
    rules: {
      'speechomania/no-comments': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'no-restricted-imports': ['error', { paths: [{ name: 'mochi-icons', message: 'Mochi Icons belong to child mode only (src/views/child, src/components/child).' }] }]
    }
  },
  {
    files: ['src/views/child/**', 'src/components/child/**', 'src/layout/learning-layout/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: boardUiPaths, message: 'Child mode uses its own touch components, not BoardUI.' }] }]
    }
  }
]
