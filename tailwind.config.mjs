/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        'cream':        '#FAFAF7',
        'ink':          '#141413',
        'ink-soft':     '#3D3D3A',
        'ink-muted':    '#6B6B6B',
        'ink-faint':    '#C0BFBA',
        'border-warm':  '#E0DED6',
        'border-light': '#F0EEE8',
        'card-bg':      '#FFFFFF',
        'hover-warm':   '#F7F5F0',
        'dark':         '#0A0A0A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        reading: ['"Source Serif 4"', 'serif'],
      },
      letterSpacing: {
        'tight-xl': '-0.03em',
        'tight-lg': '-0.02em',
        'wide-sm':  '0.06em',
        'wide-xs':  '0.05em',
        'wide-lg':  '0.09em',
      },
      fontSize: {
        'display-xl': '48px',
        'display':    '42px',
        'display-sm': '30px',
        'section-h':  '22px',
        'card-h':     ['21px', { lineHeight: '1.40' }],
      },
      maxWidth: {
        'card-list':  '1200px',
        'prose-body': '776px',
        'hero-inner': '1080px',
        'article':    '928px',
        'content':    '748px',
      },
      maxHeight: {
        'cover':       '780px',
        'block-image': '480px',
      },
      height: {
        'placeholder': '320px',
      },
      lineHeight: {
        'tight':    '1.18',
        'prose':    '1.75',
        'h1':       '1.20',
        'h2':       '1.28',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      minHeight: {
        'hero': '68vh',
      },
    }
  },
  plugins: [],
};
