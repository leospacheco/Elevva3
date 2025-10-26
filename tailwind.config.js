/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'elevva-primary': '#0e7490', // Azul/Ciano para a marca
        'elevva-secondary': '#34d399', // Verde para o destaque
      },
    },
  },
  plugins: [],
}
module.exports = config
