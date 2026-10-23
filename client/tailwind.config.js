// tailwindcss configuration object export below this code block
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--app-bg)',
          card: 'var(--app-card)',
          'card-hover': 'var(--app-card-hover)',
          muted: 'var(--app-muted)',
          border: 'var(--app-border)',
          'text-primary': 'var(--app-text-primary)',
          'text-muted': 'var(--app-text-muted)',
          accent: 'var(--app-accent)',
          'accent-hover': 'var(--app-accent-hover)',
          'accent-subtle': 'var(--app-accent-subtle)',
        },
        status: {
          strong: '#10B981',
          moderate: '#F59E0B',
          weak: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card-light': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-dark': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
};
