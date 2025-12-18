import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import preferArrowPlugin from 'eslint-plugin-prefer-arrow';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
	js.configs.recommended,
	eslintConfigPrettier,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		}
	},
	{
		plugins: {
			'prefer-arrow': preferArrowPlugin,
			'import': importPlugin,
			'simple-import-sort': simpleImportSort
		},
		rules: {
			// General
			'no-template-curly-in-string': ['error'],
			'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
			'no-var': 'error',
			'no-useless-rename': 'error',
			'object-shorthand': ['error', 'always'],
			'comma-dangle': ['error', 'never'],
			'arrow-body-style': ['error', 'as-needed'],
			'eqeqeq': ['error', 'always'],
			'dot-notation': 'error',
			'prefer-arrow-callback': 'error',
			'prefer-const': 'error',
			'prefer-template': 'error',
			'prefer-arrow/prefer-arrow-functions': 'error',
			// Typescript
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
			'@typescript-eslint/prefer-optional-chain': 'error',
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{ prefer: 'type-imports', fixStyle: 'inline-type-imports' }
			],
			'@typescript-eslint/no-unused-expressions': [
				'error',
				{ allowShortCircuit: true, allowTernary: true }
			],
			// Import
			'import/first': 'error',
			'import/newline-after-import': 'error',
			'import/no-duplicates': 'error',
			'simple-import-sort/exports': 'error',
			'simple-import-sort/imports': [
				'error',
				{
					groups: [
						// Side effect imports.
						['^\\u0000'],
						// Node.js builtins.
						['^node:'],
						// Packages.
						['^react', '^next', '^@?\\w'],
						// Internal packages.
						['^(@turtle)(/.*|$)'],
						// Absolute imports and other imports such as Vue-style `@/foo`.
						['^#'],
						// Relative imports.
						['^\\.'],
						// Style imports.
						['^.+\\.css$']
					]
				}
			]
		}
	},
	{ ignores: ['dist/**'] }
];
