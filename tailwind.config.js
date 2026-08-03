/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // 'class': requisito de NativeWind para poder forzar el tema con
  // colorScheme.set() en WEB (context/app-theme.tsx) — con el default
  // 'media' (solo prefers-color-scheme del SO), setColorScheme() truena en
  // el navegador ("Cannot manually set color scheme, as dark mode is type
  // 'media'"). En nativo no hacía falta (NativeWind resuelve los @media ahí
  // con su propio runtime), por eso no se notó hasta probar en navegador.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Roboto (Google Fonts): cargada en nativo con esos mismos alias en
      // app/_layout.tsx (useFonts) y en web vía el <link> de app/+html.tsx —
      // el nombre de familia coincide en los dos lados, sin Platform.select.
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Paleta de marca Mándalo — editable por el admin en runtime desde
        // "Aplicación" (§50, backend GET/PATCH /app-settings). El default acá
        // es el fallback antes de que cargue el fetch (primer paint); el valor
        // real lo inyecta `context/app-data.tsx` vía `vars()` de NativeWind.
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)', // naranja principal
          soft: 'rgb(var(--color-primary-soft) / <alpha-value>)', // tinte medio (degradados) — derivado
          tint: 'rgb(var(--color-primary-tint) / <alpha-value>)', // tinte claro (fondos de iconos) — derivado
        },
        dark: 'rgb(var(--color-dark) / <alpha-value>)', // azul-negro de marca (franjas/cabeceras) — fijo entre claro/oscuro, pero editable por el admin
        // Tokens de tema (claro/oscuro), resueltos vía variables CSS en global.css
        // y forzados a través de context/app-theme.tsx + context/app-data.tsx (ver NOTAS.md).
        surface: 'rgb(var(--color-surface) / <alpha-value>)', // fondo de pantalla — editable por el admin (variante oscura derivada)
        card: 'rgb(var(--color-card) / <alpha-value>)', // tarjetas/inputs (reemplaza bg-white)
        ink: 'rgb(var(--color-ink) / <alpha-value>)', // texto principal (reemplaza text-dark)
        muted: 'rgb(var(--color-muted) / <alpha-value>)', // texto secundario — editable por el admin (variante oscura derivada)
        border: 'rgb(var(--color-border) / <alpha-value>)', // líneas/divisores/fondos sutiles (reemplaza border-gray-100/200, bg-gray-100/200/300)
      },
    },
  },
  plugins: [],
};
