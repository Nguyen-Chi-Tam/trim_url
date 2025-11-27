/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'phone': {'min': '390px'},
        'custom': {'min': '1186px'},
        'xl': {'min': '1484px'},
        'xl2': {'min': '1774px'},
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'playfair': ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
    plugins: [
      require('tailwindcss-animated'),
      // ...other plugins
    ],
}
