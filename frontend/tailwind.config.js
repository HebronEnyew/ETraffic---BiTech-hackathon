/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'oxford-blue': '#002147',
        'tan': '#d2b48c',
        background: '#ffffff',
        foreground: '#002147',
      },
    },
  },
  plugins: [],
}

