module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#f3f4f6",
      },
      spacing: {
        safe: "max(1rem, env(safe-area-inset-bottom))",
      },
    },
  },
  plugins: [],
};
