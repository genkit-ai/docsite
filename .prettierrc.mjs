// .prettierrc.mjs
/** @type {import("prettier").Config} */
export default {
  singleQuote: true,
  printWidth: 120,
  objectWrap: 'preserve',
  useTabs: false,
  tabWidth: 2,
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
    {
      files: ['**/*.{md,mdx}'],
      options: {
        useTabs: false,
        tabWidth: 2,
      },
    },
  ],
};
