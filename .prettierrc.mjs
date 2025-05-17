// .prettierrc.mjs
/** @type {import("prettier").Config} */
export default {
  singleQuote: true,
  printWidth: 120,
  objectWrap: 'preserve',
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};