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
        brand: {
          primary: '#213E42',
          secondary: '#C9A78B',
          tertiary: '#F3DDC8',
          quaternary: '#91A1A1',
          light: '#FEEAD2',
        },
      },
    },
  },
  plugins: [],
}
