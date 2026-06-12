const { colors, radius, fonts } = require("./src/theme/tokens")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      borderRadius: {
        card: `${radius.card}px`,
        field: `${radius.field}px`,
        sheet: `${radius.sheet}px`,
      },
      fontFamily: {
        serif: [fonts.serif],
        "serif-medium": [fonts.serifMedium],
        "serif-italic": [fonts.serifItalic],
        sans: [fonts.sans],
        "sans-medium": [fonts.sansMedium],
        "sans-semibold": [fonts.sansSemiBold],
        mono: [fonts.mono],
      },
    },
  },
  plugins: [],
}
