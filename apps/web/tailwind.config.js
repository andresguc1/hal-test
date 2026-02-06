export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base System (Dark Mode prioritized for Landing)
        background: "#0f172a", // Canvas Dark Blue
        surface: "#1E293B", // Slate 800 for surface to match
        "surface-secondary": "#334155",

        // Semantic Colors
        // Apple Tints (Dark Mode)
        apple: {
          blue: {
            400: "#409eff",
            500: "#0A84FF",
          },
          green: "#30D158",
          orange: "#FF9F0A",
        },
        hal: {
          primary: {
            400: "#818cf8",
            500: "#6366F1",
          },
          success: { 500: "#10B981" },
          error: { 500: "#F43F5E" },
          warning: { 500: "#F59E0B" },
          neutral: { 200: "#E4E4E7", 500: "#71717A" },
        },
      },
      fontFamily: {
        mono: ["Geist Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
