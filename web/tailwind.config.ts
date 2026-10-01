import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        background: "var(--bg)",
        "background-deep": "var(--bg-deep)",
        foreground: "var(--fg)",
        card: {
          DEFAULT: "var(--card-bg)",
          foreground: "var(--fg)",
        },
        "card-2": "var(--card-2)",
        muted: {
          DEFAULT: "var(--muted-bg)",
          foreground: "var(--fg-70)",
        },
        border: "var(--line-2)",
        input: "var(--line-2)",
        ring: "var(--accent)",
        line: "var(--line)",
        "line-2": "var(--line-2)",

        accent: {
          DEFAULT: "var(--accent)",
          wash: "var(--accent-wash)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },

        success: "var(--success)",
        "success-fg": "var(--success-fg)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
        card: "12px",
        button: "8px",
        pill: "20px",
      },
      spacing: {
        bottom: "var(--bottom-nav-height, 80px)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(138, 162, 101, 0.55)" },
          "50%": { boxShadow: "0 0 0 6px rgba(138, 162, 101, 0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 350ms ease-out both",
        "soft-pulse": "soft-pulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
