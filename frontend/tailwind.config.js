/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#04070d",
          1: "#080c15",
          2: "#0c111c",
          3: "#111827",
          4: "#1a2035",
          5: "#1e2640",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          DEFAULT: "rgba(255,255,255,0.09)",
          strong: "rgba(255,255,255,0.14)",
          glow: "rgba(197,164,78,0.25)",
        },
        text: {
          primary: "#f0f2f7",
          secondary: "#8b95b0",
          tertiary: "#4e5875",
          inverse: "#080c15",
          muted: "#3a4263",
        },
        accent: {
          gold: "#c9a94e",
          "gold-bright": "#dfc062",
          "gold-dim": "rgba(201,169,78,0.12)",
          blue: "#5b8def",
          "blue-dim": "rgba(91,141,239,0.12)",
          purple: "#8b6cf6",
          "purple-dim": "rgba(139,108,246,0.12)",
          cyan: "#22d3ee",
        },
        data: {
          positive: "#34d399",
          "positive-dim": "rgba(52,211,153,0.12)",
          negative: "#f87171",
          "negative-dim": "rgba(248,113,113,0.12)",
          neutral: "#6b7394",
          warning: "#fbbf24",
          "warning-dim": "rgba(251,191,36,0.12)",
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
        glow: "0 0 20px -5px rgba(201,169,78,0.15)",
        "glow-blue": "0 0 20px -5px rgba(91,141,239,0.15)",
        "glow-lg": "0 0 40px -10px rgba(201,169,78,0.2)",
        card: "0 1px 3px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.4), 0 8px 30px rgba(0,0,0,0.2)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.04)",
        float: "0 8px 30px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-mesh":
          "radial-gradient(at 27% 37%, rgba(201,169,78,0.08) 0px, transparent 50%), radial-gradient(at 97% 21%, rgba(91,141,239,0.06) 0px, transparent 50%), radial-gradient(at 52% 99%, rgba(139,108,246,0.05) 0px, transparent 50%), radial-gradient(at 10% 29%, rgba(52,211,153,0.04) 0px, transparent 50%)",
        "card-shimmer":
          "linear-gradient(110deg, transparent 33%, rgba(255,255,255,0.03) 50%, transparent 67%)",
      },
      animation: {
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
