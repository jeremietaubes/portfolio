/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        'cream':        '#FAFAF7',
        'ink':          '#1A1A16',
        'ink-soft':     '#5A5A4E',
        'ink-muted':    '#8A8878',
        'ink-faint':    '#C0BFBA',
        'border-warm':  '#E0DED6',
        'border-light': '#F0EEE8',
        'card-bg':      '#FFFFFF',
        'hover-warm':   '#F7F5F0',
        'dark':         '#0A0A0A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        'tight-xl': '-0.03em',
        'tight-lg': '-0.02em',
        'wide-sm':  '0.06em',
        'wide-xs':  '0.05em',
        'wide-lg':  '0.09em',
      },
      fontSize: {
        'display':    ['44px', { lineHeight: '1.08' }],
        'display-sm': ['28px', { lineHeight: '1.08' }],
        'section-h':  ['22px', { lineHeight: '1.4'  }],
      },
      maxWidth: {
        'card-list':  '900px',
        'prose-body': '680px',
        'hero-inner': '720px',
        'article':    '748px',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      minHeight: {
        'hero': '67vh',
      },
    }
  },
  plugins: [],
};
