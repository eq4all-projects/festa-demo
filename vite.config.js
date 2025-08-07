import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), tailwindcss({ config: "./tailwind.config.js" }), svgr()],
  build: {
    outDir: "dist",
    sourcemap: true, // 소스맵 생성 활성화
  },
});
