import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sky: "#060d18",
        cloud: "#0d1b2e",
        panel: "#112440",
        ink: "#dce8f4",
        mist: "#1e3456",
        storm: "#22d3ee",
        tide: "#0891b2",
        frost: "#7dd3fc",
        signal: "#fbbf24",
        ember: "#f97316"
      },
      fontFamily: {
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
        body: ["Avenir Next", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"]
      },
      boxShadow: {
        card: "0 28px 90px rgba(0, 0, 0, 0.40)"
      }
    }
  },
  plugins: []
};

export default config;
