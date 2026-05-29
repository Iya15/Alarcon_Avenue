import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },

            colors: {
                // ── Ink scale (black family — text, borders, surfaces) ──────────
                ink: {
                    50:  '#fafafa',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                    950: '#0a0a0a',
                },

                // ── Brand scale (#e7901d family) ─────────────────────────────────
                brand: {
                    50:  '#fff8ed',
                    100: '#fef0d3',
                    200: '#fcd9a0',
                    300: '#f8ba5b',
                    400: '#f59d28',
                    500: '#e7901d',
                    600: '#cf7811',
                    700: '#a65a0d',
                    800: '#854710',
                    900: '#6c3b11',
                    950: '#3d1e07',
                    DEFAULT: '#e7901d',
                },

                // ── Status — ONLY in status badges and form validation ────────────
                success: {
                    50:  '#f0fdf4',
                    100: '#dcfce7',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                },
                danger: {
                    50:  '#fef2f2',
                    100: '#fee2e2',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                },

                surface: '#ffffff',
                canvas:  '#fafafa',
            },

            boxShadow: {
                xs:    '0 1px 2px rgba(0,0,0,0.04)',
                sm:    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                md:    '0 4px 8px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
                lg:    '0 12px 24px rgba(0,0,0,0.07), 0 4px 8px rgba(0,0,0,0.04)',
                xl:    '0 24px 48px rgba(0,0,0,0.09), 0 8px 16px rgba(0,0,0,0.04)',
                brand: '0 0 0 3px rgba(231,144,29,0.2)',
            },

            letterSpacing: {
                tighter: '-0.03em',
                tight:   '-0.02em',
            },

            maxWidth: {
                'container-sm':  '640px',
                'container-md':  '768px',
                'container-lg':  '1024px',
                'container-xl':  '1280px',
                'container-2xl': '1536px',
            },

            transitionTimingFunction: {
                apple: 'cubic-bezier(0.32, 0.72, 0, 1)',
            },

            keyframes: {
                shimmer: {
                    '0%':   { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            animation: {
                shimmer: 'shimmer 1.8s ease-in-out infinite',
            },
        },
    },

    plugins: [forms],
};
