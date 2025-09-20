import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // Path to all files in your Next.js app
    "./src/**/*.{js,ts,jsx,tsx,mdx}",

    // Correct path to your shared UI package
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: "media",
};
export default config;
