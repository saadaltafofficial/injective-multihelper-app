/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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

