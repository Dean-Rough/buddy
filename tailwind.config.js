/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sink': ['Sink', 'Arial Black', 'sans-serif'],
        'just': ['JUST Sans', 'system-ui', 'sans-serif'],
        'casual': ['CasualHuman', 'Comic Sans MS', 'cursive'],
        sans: ['JUST Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        'brutal': {
          'black': '#000000',
          'white': '#ffffff',
          'yellow': '#FFE500',
          'pink': '#FF69B4',
          'blue': '#00BFFF',
          'green': '#32CD32',
          'orange': '#FF6347',
          'purple': '#9966CC',
          'red': '#FF3030',
        },
        'buddy-blue': '#667eea',
        'buddy-purple': '#764ba2',
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
      },
      boxShadow: {
        'brutal': '4px 4px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
      },
    },
  },
  plugins: [],
}