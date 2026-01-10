/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "SF Mono",
          "Menlo",
          "Monaco",
          "Courier New",
          "monospace",
        ],
      },
      colors: {
        // Apple System Grays (Light/Dark adaptive concept)
        ios: {
          bg: "var(--ios-bg)",
          card: "var(--ios-card)",
          text: "var(--ios-text)",
          subtext: "var(--ios-subtext)",
          border: "var(--ios-border)",
          blue: "#007AFF",
          green: "#34C759",
          red: "#FF3B30",
          divider: "rgba(60, 60, 67, 0.36)",
        },
        // Semantic mappings to Apple Tokens (Shadcn Compatibility)
        background: "rgb(var(--system-background))",
        foreground: "rgb(var(--label-primary))",

        card: {
          DEFAULT: "rgb(var(--system-grouped-content))",
          foreground: "rgb(var(--label-primary))",
        },
        popover: {
          DEFAULT: "rgb(var(--system-grouped-content))",
          foreground: "rgb(var(--label-primary))",
        },

        primary: {
          DEFAULT: "rgb(var(--tint-blue))",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "rgb(var(--fill-secondary))",
          foreground: "rgb(var(--label-primary))",
        },
        muted: {
          DEFAULT: "rgb(var(--fill-tertiary))",
          foreground: "rgb(var(--label-secondary))",
        },
        accent: {
          DEFAULT: "rgb(var(--tint-blue))",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "rgb(var(--tint-red))",
          foreground: "#FFFFFF",
        },

        border: "rgba(var(--separator) / 0.3)",
        input: "rgba(var(--fill-tertiary) / 0.5)",
        ring: "rgb(var(--tint-blue))",

        // Apple System-specific (Legacy reference)
        apple: {
          gray: "rgb(var(--tint-gray))",
          blue: "rgb(var(--tint-blue))",
          green: "rgb(var(--tint-green))",
          indigo: "rgb(var(--tint-indigo))",
          orange: "rgb(var(--tint-orange))",
          pink: "rgb(var(--tint-pink))",
          purple: "rgb(var(--tint-purple))",
          red: "rgb(var(--tint-red))",
          teal: "rgb(var(--tint-teal))",
          yellow: "rgb(var(--tint-yellow))",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        depth: "var(--shadow-depth)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        float: "0 20px 40px -10px rgba(0,0,0,0.1)",
      },
      transitionTimingFunction: {
        "apple-ease": "cubic-bezier(0.25, 0.1, 0.25, 1)", // iOS default ease
        "apple-spring": "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Smooth spring
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.2s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
// Force JIT Rebuild: 2026-01-09T22:24:44-05:00
