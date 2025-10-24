import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      https: {
      key: fs.readFileSync(path.resolve(__dirname, '../cert/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../cert/cert.pem')),
    },
      "/api": {
        target: "https://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "https://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  envDir: "./env",
});
