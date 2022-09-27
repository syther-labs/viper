const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    colors: {
      ...colors,
      primary: '#24B236',
      'primary-accent': '#0e3013',
      'z-1': '#F8F9FA',
      'z-2': '#E9ECEF',
      'z-3': '#DEE2E6',
      'z-4': '#CED4DA',
      'z-5': '#ADB5BD',
      'z-6': '#6C757D',
      'z-7': '#495057',
      'z-8': '#343A40',
      'z-9': '#212529',
      'z-10': '#151617',
    },
    borderWidth: {
      1: '1px',
    },
  },
  variants: {},
  plugins: [],
};
