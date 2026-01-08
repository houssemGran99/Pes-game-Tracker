/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Custom Theme Colors from App.css
                primary: {
                    DEFAULT: '#00d4ff',
                    glow: 'rgba(0, 212, 255, 0.3)',
                },
                secondary: {
                    DEFAULT: '#ff6b35',
                },
                success: {
                    DEFAULT: '#00ff88',
                },
                danger: {
                    DEFAULT: '#ff4757',
                },
                warning: {
                    DEFAULT: '#ffa502',
                },
                bg: {
                    primary: '#0a0a0f',
                    secondary: '#12121a',
                    card: 'rgba(25, 25, 40, 0.8)',
                    glass: 'rgba(255, 255, 255, 0.05)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                'gradient-card': 'linear-gradient(145deg, rgba(25, 25, 40, 0.9), rgba(15, 15, 25, 0.9))',
                'gradient-bg': 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 70%)',
            }
        },
    },
    plugins: [],
};
