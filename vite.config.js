import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), tailwindcss({ config: "./tailwind.config.js" }), svgr()],
  server: {
    host: "0.0.0.0", // 모든 네트워크 인터페이스에서 접근 가능
    port: 5173, // 기본 포트 설정 (선택사항)
  },
  build: {
    outDir: "dist",
    sourcemap: true, // 소스맵 생성 활성화
  },
});
