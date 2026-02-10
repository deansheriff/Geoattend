module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        primary: "#2b8cee",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        success: "#10b981",
        error: "#ef4444"
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};