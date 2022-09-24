module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
    theme: {
      borderWidth: {
        1: "1px",
      },
    },
  },
  plugins: [],
};
