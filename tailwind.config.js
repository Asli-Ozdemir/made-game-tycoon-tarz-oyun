module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },  // preflight kills animations via prefers-reduced-motion
  theme: { extend: {} },
  plugins: []
}
