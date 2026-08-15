import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// В dev: фронт на 5173, /api уходит в FastAPI на 8000.
// В проде: билд ложится в dist/, его раздаёт FastAPI как статику.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});