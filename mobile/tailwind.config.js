/** Token AMS Integrated System — cermin src/index.css induk (docs/mobile-apps.md §5). */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f7f8f8', 100: '#f1f2f2', 200: '#e3e5e5', 300: '#d2d5d5',
          400: '#a3a3a3', 500: '#7a7a7a', 600: '#5c5c5c', 700: '#3d3d3d',
          800: '#252525', 900: '#111111', 950: '#0a0a0a'
        },
        blue: {
          50: '#eaf7ff', 100: '#d5efff', 200: '#addfff', 300: '#79cbff',
          400: '#3ab4ff', 500: '#00aaff', 600: '#0093d9', 700: '#0078b5',
          800: '#005e92', 900: '#00446c', 950: '#002e45'
        },
        orange: {
          50: '#fff1ec', 100: '#ffe0d4', 200: '#ffc2ad', 300: '#ff9b7d',
          400: '#ff704a', 500: '#ff4400', 600: '#e63b00', 700: '#c13200',
          800: '#9c2800', 900: '#7a1f00', 950: '#400f00'
        },
        indigo: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
        },
        emerald: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b', 950: '#022c22'
        },
        amber: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f', 950: '#451a03'
        },
        rose: {
          50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
          400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
          800: '#9f1239', 900: '#881337', 950: '#4c0519'
        }
      },
      fontSize: {
        '2xs': ['10.5px', { lineHeight: '14px' }],
        '3xs': ['9.5px', { lineHeight: '12px' }]
      },
      fontFamily: {
        sans: ['Quicksand_400Regular'],
        'sans-medium': ['Quicksand_500Medium'],
        'sans-semibold': ['Quicksand_600SemiBold'],
        'sans-bold': ['Quicksand_700Bold'],
        mono: ['JetBrainsMono_400Regular'],
        'mono-bold': ['JetBrainsMono_700Bold']
      }
    }
  },
  plugins: []
};