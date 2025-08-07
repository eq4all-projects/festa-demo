/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#5A80CB",
        "brand-gray": "#2C2C2C",
        "brand-bg": "#F0F0F3",
      },
      backgroundImage: {
        "button-gradient": "linear-gradient(135deg, #6B73FF 0%, #5A63E8 100%)",
      },
      boxShadow: {
        neumorphism:
          "10px 10px 30px 0px rgba(174, 174, 192, 0.4), -10px -10px 30px 0px rgba(255, 255, 255, 1)",
        "button-shadow":
          "0 12px 24px rgba(107, 115, 255, 0.4), 0 6px 12px rgba(107, 115, 255, 0.2)",
        custom: "5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff",
      },
      fontWeight: {
        "extra-bold": "800",
      },
      letterSpacing: {
        tighter: "-0.02em",
      },
    },
    fontFamily: {
      sans: [
        "Pretendard-Regular",
        "-apple-system",
        "BlinkMacSystemFont",
        "system-ui",
        "sans-serif",
      ],
    },
  },
  plugins: [],
};
