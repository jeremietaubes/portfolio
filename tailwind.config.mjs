/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    screens: {
      'xs':  '375px',
      'sm':  '640px',
      'md':  '768px',
      'lg':  '1024px',
      'xl':  '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        'cream':        '#FAFAF7',
        'ink':          '#141413',
        'ink-soft':     '#2D2D2A',
        'ink-muted':    '#6B6B6B',
        'ink-faint':    '#C0BFBA',
        'border-warm':  '#E0DED6',
        'border-light': '#F0EEE8',
        'card-bg':      '#FFFFFF',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        reading: ['"DM Sans"', 'sans-serif'],
      },
      letterSpacing: {
        'wide-lg':  '0.09em',
      },
      fontSize: {
        'display-xl': '55.8px',
        'display':    '52.5px',
        'display-sm': '34.4px',
        'section-h':  '26px',
        'card-h':     ['22.5px', { lineHeight: '1.40' }],
      },
      maxWidth: {
        'card-list':  '1200px',
        'prose-body': '776px',
        'hero-inner': '1080px',
        'article':    '928px',
      },
      maxHeight: {
        'cover':       '780px',
        'block-image': '480px',
      },
      height: {
        'placeholder': '320px',
      },
      lineHeight: {
        'tight':    '1.12',
        'prose':    '1.6',
        'h1':       '1.12',
        'h2':       '1.18',
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
