// Flat ESLint config for ESLint v9+
// Scope: TypeScript/React app code under src; ignore extension/functions/docs.
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      // Ignore non-web surfaces and serverless functions
      'supabase/**',
      'src/supabase/**',
      'src/mobile/**',
      'mobile/**',
      'extension/**',
      'src/browser-extension/**',
      'docs/**',
      'database/**',
      'tailwind.config.js',
      // Added: ignore generated supabase types (very large files)
      'src/types/supabase.ts',
      'src/types/supabase.gen.ts',
      'src/types/supabase.gen.tmp.ts',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}', '*.ts', '*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: false,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      'no-console': ['error'],
      'no-debugger': ['error'],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: false }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      'sort-imports': ['warn', { ignoreDeclarationSort: true, allowSeparatedGroups: true }],
    },
  },
  // Overrides for tests and scripts: relax strict rules
  {
    files: [
      'tests/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      'scripts/**/*.{ts,js}',
      '*.js',
      'test-*.js',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  }
)
