/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          black: "#000000",
          panel: "#050505",
          surface: "#0a0a0a",
          raised: "#111111",
          border: "#1a1a1a",
          "border-bright": "#2a2a2a",
        },
        phosphor: {
          DEFAULT: "#00ff41",
          dim: "rgba(0,255,65,0.08)",
          bright: "#33ff66",
          muted: "#00cc33",
        },
        amber: {
          DEFAULT: "#ffb000",
          dim: "rgba(255,176,0,0.08)",
          bright: "#ffc033",
        },
        data: {
          positive: "#00ff41",
          "positive-dim": "rgba(0,255,65,0.06)",
          negative: "#ff3333",
          "negative-dim": "rgba(255,51,51,0.06)",
          neutral: "#555555",
          warning: "#ffb000",
          "warning-dim": "rgba(255,176,0,0.06)",
          info: "#00aaff",
          "info-dim": "rgba(0,170,255,0.06)",
        },
        text: {
          primary: "#cccccc",
          secondary: "#888888",
          tertiary: "#555555",
          muted: "#333333",
          inverse: "#000000",
          green: "#00ff41",
        },
        accent: {
          purple: "#aa66ff",
          "purple-dim": "rgba(170,102,255,0.08)",
        },
        // Backwards compatibility aliases for components that reference old tokens
        surface: {
          0: "#000000",
          1: "#050505",
          2: "#0a0a0a",
          3: "#111111",
          4: "#1a1a1a",
          5: "#222222",
        },
        border: {
          subtle: "#1a1a1a",
          DEFAULT: "#222222",
          strong: "#2a2a2a",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Fira Code"', "monospace"],
        sans: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        none: "none",
        card: "none",
        "card-hover": "none",
        float: "none",
        inner: "none",
        glow: "0 0 4px rgba(0,255,65,0.3)",
        "glow-amber": "0 0 4px rgba(255,176,0,0.3)",
      },
      borderRadius: {
        none: "0",
        sm: "1px",
        DEFAULT: "1px",
        md: "1px",
        lg: "1px",
        xl: "1px",
        "2xl": "1px",
        "3xl": "1px",
        full: "1px",
      },
      animation: {
        "cursor-blink": "blink 1s step-end infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-up": "fadeUp 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
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
