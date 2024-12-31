/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        "desktop": { max: "1024px" }, // Applies styles for screens <= 1024px
        "tablet": { max: "640px" },   // Applies styles for screens <= 640px
      },
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

