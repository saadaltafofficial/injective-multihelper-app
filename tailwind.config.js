/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-blue': 'rgba(37, 23, 169, 0.8)',
        'navbar-bg': 'rgba(241, 241, 242, .1)'
      },
      fontFamily: {
        Poppins: ['Poppins', 'sans-serif'], // Use the 'Poppins' font family
      },
      backgroundImage: {
        'hero-image': "url('src/assets/bg-main.webp')",
      },
    },
  },
  plugins: [],
}

