import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss({ config: "./tailwind.config.js" }), svgr()],
  root: "src",
  build: {
    outDir: "../dist",
    sourcemap: true, // 소스맵 생성 활성화
    rollupOptions: {
      input: {
        // WebGLPlayer 라이브러리 진입점
        WebGLPlayer: resolve(__dirname, "src/userInterface.js"),
        // Web Worker 진입점
        "loadingWorker.min": resolve(
          __dirname,
          "src/libs/webgl_player_2.1/src/libs/workers/LoadingWorker.js"
        ),
      },
      output: {
        // 진입점 파일 이름 설정 (e.g., WebGLPlayer.js, loadingWorker.min.js)
        entryFileNames: "[name].js",
        // CSS 및 기타 에셋 파일 이름 설정 (e.g., WebGLPlayer.css)
        assetFileNames: "[name].[ext]",
        // 코드 분할(chunk) 파일 이름 설정
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },
  },
});
