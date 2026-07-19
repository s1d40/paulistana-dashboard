import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ecommerce: {
          bg: 'var(--ecommerce-bg)',
          card: 'var(--ecommerce-card)',
          border: 'var(--ecommerce-border)',
          text: 'var(--ecommerce-text)',
          muted: 'var(--ecommerce-muted)',
          accent: 'var(--ecommerce-accent)',
        }
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
