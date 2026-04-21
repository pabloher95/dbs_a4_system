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
        sky: "#edf5fb",
        cloud: "#f9fcff",
        ink: "#16212b",
        mist: "#dbe7f1",
        storm: "#214a68",
        tide: "#5b7c96",
        frost: "#8fc4db",
        signal: "#ffb35c",
        ember: "#ff8a5b"
      },
      fontFamily: {
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
        body: ["Avenir Next", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"]
      },
      boxShadow: {
        card: "0 28px 90px rgba(18, 34, 48, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
