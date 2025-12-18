/** @type {import("prettier").Config} */
module.exports = {
	useTabs: true,
	singleQuote: true,
	quoteProps: 'consistent',
	trailingComma: 'none',
	arrowParens: 'avoid',
	endOfLine: 'auto',
	plugins: [require.resolve('prettier-plugin-tailwindcss')]
};
