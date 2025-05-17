import colors from "tailwindcss/colors";
import base from "tailwindcss/base";
import starlightPlugin from "@astrojs/starlight-tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        // Your preferred accent color. Indigo is closest to Starlight’s defaults.
        accent: colors.blue,

        // Your preferred gray scale. Zinc is closest to Starlight’s defaults.
        gray: colors.zinc,
      },
      fontFamily: {
        mono: ["Google Sans Mono", "0xProto", "monospace"],
      },
    },
  },
  plugins: [starlightPlugin()],
};
