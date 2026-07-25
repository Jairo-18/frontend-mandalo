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
        dark: '#1E1E2D', // azul-negro de marca (franjas/cabeceras) — FIJO, no cambia con el tema
        // Tokens de tema (claro/oscuro), resueltos vía variables CSS en global.css
        // y forzados a través de context/app-theme.tsx (ver NOTAS.md).
        surface: 'rgb(var(--color-surface) / <alpha-value>)', // fondo de pantalla
        card: 'rgb(var(--color-card) / <alpha-value>)', // tarjetas/inputs (reemplaza bg-white)
        ink: 'rgb(var(--color-ink) / <alpha-value>)', // texto principal (reemplaza text-dark)
        muted: 'rgb(var(--color-muted) / <alpha-value>)', // texto secundario
        border: 'rgb(var(--color-border) / <alpha-value>)', // líneas/divisores/fondos sutiles (reemplaza border-gray-100/200, bg-gray-100/200/300)
      },
    },
  },
  plugins: [],
};
