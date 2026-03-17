/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#09090b",
          1: "#0c0c0f",
          2: "#111114",
          3: "#18181b",
          4: "#1f1f23",
          5: "#27272a",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          DEFAULT: "rgba(255,255,255,0.09)",
          strong: "rgba(255,255,255,0.15)",
        },
        text: {
          primary: "#f0f0f3",
          secondary: "#8e8e9a",
          tertiary: "#5a5a6a",
          inverse: "#09090b",
          muted: "#42424d",
        },
        accent: {
          gold: "#b5935a",
          "gold-bright": "#c9a868",
          "gold-dim": "rgba(181,147,90,0.08)",
          blue: "#5b8def",
          "blue-dim": "rgba(91,141,239,0.08)",
          purple: "#8b7cf6",
          "purple-dim": "rgba(139,124,246,0.08)",
          cyan: "#22d3ee",
        },
        data: {
          positive: "#4ade80",
          "positive-dim": "rgba(74,222,128,0.08)",
          negative: "#f87171",
          "negative-dim": "rgba(248,113,113,0.08)",
          neutral: "#71717a",
          warning: "#fbbf24",
          "warning-dim": "rgba(251,191,36,0.08)",
          info: "#5b8def",
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
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4)",
        "card-hover": "0 2px 8px rgba(0,0,0,0.5)",
        float: "0 4px 16px rgba(0,0,0,0.4)",
        inner: "inset 0 1px 0 rgba(255,255,255,0.03)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
