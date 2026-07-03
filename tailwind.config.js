/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta de marca Mándalo
        primary: {
          DEFAULT: '#FF5A3C', // naranja principal
          soft: '#FF8C6E', // tinte medio (degradados)
          tint: '#FFE7E1', // tinte claro (fondos de iconos)
        },
        dark: '#1E1E2D', // azul-negro (títulos / texto fuerte)
        muted: '#7A7A8A', // gris (texto secundario)
        surface: '#F2F2F2', // gris muy claro (fondos)
      },
    },
  },
  plugins: [],
};
