/** Colors resolve to CSS variables declared in index.css so JS, CSS and Tailwind share one source. */
const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', '"Helvetica Neue"', 'Helvetica', 'Inter', 'Arial', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        ink: withAlpha('--color-ink'),
        mint: withAlpha('--color-mint'),
        cream: withAlpha('--color-cream'),
        canvas: withAlpha('--color-canvas'),
        blush: withAlpha('--color-blush'),
        success: withAlpha('--color-success'),
        warning: withAlpha('--color-warning'),
        danger: withAlpha('--color-danger'),
      },
      fontSize: {
        '3xs': '0.625rem',
        '2xs': '0.6875rem',
        body: '0.9375rem',
        title: '1.75rem',
        'display-sm': '2rem',
        display: '2.25rem',
        metric: '2.5rem',
        hero: '2.75rem',
        jumbo: '3rem',
        'hero-lg': '3.5rem',
        'jumbo-lg': '4rem',
        giant: '6rem',
      },
      lineHeight: {
        display: '1.02',
      },
      borderRadius: {
        tile: '1.25rem',
        bubble: '1.375rem',
        callout: '1.5rem',
        card: '1.75rem',
        panel: '2rem',
        sheet: '2.25rem',
        overlay: '2.5rem',
      },
      boxShadow: {
        float: '0 12px 32px rgb(var(--color-ink) / 0.25)',
        popover: '0 16px 40px rgb(var(--color-ink) / 0.12)',
      },
      spacing: {
        hairline: '3px',
        cell: '2.375rem',
        fab: '3.375rem',
      },
      minHeight: {
        card: '11rem',
        stat: '10.5rem',
      },
      maxWidth: {
        switcher: '13.75rem',
        bubble: '85%',
        'bubble-wide': '92%',
        inset: 'calc(100vw - 2.5rem)',
      },
      width: {
        popover: '21.25rem',
        sheet: '28.75rem',
      },
      height: {
        sheet: '92dvh',
      },
      maxHeight: {
        dropzone: '30rem',
      },
      zIndex: {
        nav: '30',
        popover: '40',
        sheet: '50',
        dialog: '70',
        overlay: '80',
      },
      transitionProperty: {
        ring: 'stroke-dashoffset',
      },
      transitionDuration: {
        400: '400ms',
      },
      gridTemplateColumns: {
        'main-aside': 'minmax(0, 1fr) 380px',
        split: 'minmax(0, 1fr) minmax(0, 1.1fr)',
      },
    },
  },
};
