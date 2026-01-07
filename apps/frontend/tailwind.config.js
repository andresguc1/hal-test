/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-mono)', 'Consolas', 'monospace'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            // HAL-TEST Semantic Color Extensions
            'hal-success': {
                50: 'rgb(var(--hal-success-50))',
                100: 'rgb(var(--hal-success-100))',
                200: 'rgb(var(--hal-success-200))',
                300: 'rgb(var(--hal-success-300))',
                400: 'rgb(var(--hal-success-400))',
                500: 'rgb(var(--hal-success-500))',
                600: 'rgb(var(--hal-success-600))',
                700: 'rgb(var(--hal-success-700))',
                800: 'rgb(var(--hal-success-800))',
                900: 'rgb(var(--hal-success-900))',
                950: 'rgb(var(--hal-success-950))',
            },
            'hal-error': {
                50: 'rgb(var(--hal-error-50))',
                100: 'rgb(var(--hal-error-100))',
                200: 'rgb(var(--hal-error-200))',
                300: 'rgb(var(--hal-error-300))',
                400: 'rgb(var(--hal-error-400))',
                500: 'rgb(var(--hal-error-500))',
                600: 'rgb(var(--hal-error-600))',
                700: 'rgb(var(--hal-error-700))',
                800: 'rgb(var(--hal-error-800))',
                900: 'rgb(var(--hal-error-900))',
                950: 'rgb(var(--hal-error-950))',
            },
            'hal-warning': {
                50: 'rgb(var(--hal-warning-50))',
                100: 'rgb(var(--hal-warning-100))',
                200: 'rgb(var(--hal-warning-200))',
                300: 'rgb(var(--hal-warning-300))',
                400: 'rgb(var(--hal-warning-400))',
                500: 'rgb(var(--hal-warning-500))',
                600: 'rgb(var(--hal-warning-600))',
                700: 'rgb(var(--hal-warning-700))',
                800: 'rgb(var(--hal-warning-800))',
                900: 'rgb(var(--hal-warning-900))',
                950: 'rgb(var(--hal-warning-950))',
            },
            'hal-primary': {
                50: 'rgb(var(--hal-primary-50))',
                100: 'rgb(var(--hal-primary-100))',
                200: 'rgb(var(--hal-primary-200))',
                300: 'rgb(var(--hal-primary-300))',
                400: 'rgb(var(--hal-primary-400))',
                500: 'rgb(var(--hal-primary-500))',
                600: 'rgb(var(--hal-primary-600))',
                700: 'rgb(var(--hal-primary-700))',
                800: 'rgb(var(--hal-primary-800))',
                900: 'rgb(var(--hal-primary-900))',
                950: 'rgb(var(--hal-primary-950))',
            },
            'hal-neutral': {
                50: 'rgb(var(--hal-neutral-50))',
                100: 'rgb(var(--hal-neutral-100))',
                200: 'rgb(var(--hal-neutral-200))',
                300: 'rgb(var(--hal-neutral-300))',
                400: 'rgb(var(--hal-neutral-400))',
                500: 'rgb(var(--hal-neutral-500))',
                600: 'rgb(var(--hal-neutral-600))',
                700: 'rgb(var(--hal-neutral-700))',
                800: 'rgb(var(--hal-neutral-800))',
                900: 'rgb(var(--hal-neutral-900))',
                950: 'rgb(var(--hal-neutral-950))',
            },
            keyframes: {
                // Technical pulse for running states
                'pulse-technical': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                // Subtle glow for success states
                'glow-success': {
                    '0%, 100%': { boxShadow: '0 0 5px rgb(var(--hal-success-500) / 0.5)' },
                    '50%': { boxShadow: '0 0 20px rgb(var(--hal-success-500) / 0.8)' },
                },
                // Shake for error states
                'shake-error': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-4px)' },
                    '75%': { transform: 'translateX(4px)' },
                },
            },
            animation: {
                'pulse-technical': 'pulse-technical 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow-success': 'glow-success 2s ease-in-out infinite',
                'shake-error': 'shake-error 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
            },
        }
    },
    // eslint-disable-next-line no-undef
    plugins: [require("tailwindcss-animate")],
}
