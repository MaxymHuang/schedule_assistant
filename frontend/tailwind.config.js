/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          base: '#FAF9EE',
          accent: '#A2AF9B',
          tan: '#DCCFC0',
          mist: '#EEEEEE',
        },
        // Semantic aliases
        primary: '#A2AF9B',
        surface: '#FAF9EE',
        muted: '#DCCFC0',
      },
      boxShadow: {
        card: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
};


