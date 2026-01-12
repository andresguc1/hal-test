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
        hal: {
          primary: { 500: "#6366F1" }, // Indigo
          success: { 500: "#10B981" }, // Emerald
          error: { 500: "#F43F5E" }, // Rose
          warning: { 500: "#F59E0B" }, // Amber
          neutral: { 200: "#E4E4E7", 500: "#71717A" }, // Zinc
        },

        // Apple Tints (Dark Mode)
        apple: {
          blue: "#0A84FF",
          green: "#30D158",
          orange: "#FF9F0A",
        },
      },
      fontFamily: {
        mono: ["Geist Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
