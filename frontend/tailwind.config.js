/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#060a13",
          1: "#0a0e17",
          2: "#0f1320",
          3: "#151a2d",
          4: "#1a2035",
          5: "#1e2540",
        },
        border: {
          subtle: "#1e2540",
          DEFAULT: "#252d4a",
          strong: "#313b5e",
        },
        text: {
          primary: "#e4e8f1",
          secondary: "#8891a8",
          tertiary: "#5a6380",
          inverse: "#0a0e17",
        },
        accent: {
          gold: "#c5a44e",
          "gold-bright": "#d4b456",
          blue: "#4a7fff",
          purple: "#8b5cf6",
        },
        data: {
          positive: "#2d9d78",
          "positive-dim": "#1a5c47",
          negative: "#d45656",
          "negative-dim": "#7a2e2e",
          neutral: "#6b7394",
          warning: "#d4944e",
          info: "#4a7fff",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
    },
  },
  plugins: [],
};
