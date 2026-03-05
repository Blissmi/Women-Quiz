// Support both Tailwind v3 and v4+ where the PostCSS plugin moved to
// '@tailwindcss/postcss'. Attempt to require the v4 plugin first,
// and fall back to 'tailwindcss' for v3 installations.
const tailwindPlugin = (() => {
  try {
    return require('@tailwindcss/postcss')
  } catch (e) {
    return require('tailwindcss')
  }
})()

module.exports = {
  plugins: [
    tailwindPlugin,
    require('autoprefixer'),
  ],
}
