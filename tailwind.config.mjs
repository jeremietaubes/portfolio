/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        'cream':        '#FAFAF7',
        'ink':          '#141413',
        'ink-soft':     '#3D3D3A',
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
        display: ['Bricolage Grotesque', 'sans-serif'],
      },
      letterSpacing: {
        'tight-xl': '-0.03em',
        'tight-lg': '-0.02em',
        'wide-sm':  '0.06em',
        'wide-xs':  '0.05em',
        'wide-lg':  '0.09em',
      },
      fontSize: {
        'display':    ['44px', { lineHeight: '1.08', fontWeight: '700' }],
        'display-sm': ['28px', { lineHeight: '1.08', fontWeight: '700' }],
        'section-h':  ['22px', { lineHeight: '1.4',  fontWeight: '700' }],
      },
      maxWidth: {
        'card-list':  '1200px',
        'prose-body': '680px',
        'hero-inner': '970px',
        'article':    '880px',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      minHeight: {
        'hero': '60vh',
      },
    }
  },
  plugins: [],
};
