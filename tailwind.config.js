/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { gold: '#c7a66a', ink: '#10100f', charcoal: '#181817' }, fontFamily: { sans: ['Manrope', 'sans-serif'], display: ['Playfair Display', 'serif'] } } },
  plugins: [],
}
