import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        // Accent and grayscale colors
        accent: colors.blue,
        gray: colors.zinc,
      },
      fontFamily: {
        mono: ["Google Sans Mono", "0xProto", "monospace"],
      },
    },
  },
  plugins: [],
};
