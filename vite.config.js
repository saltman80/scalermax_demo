import { defineConfig } from "vite";

export default defineConfig({
  define: {
    "process.env.SCALERMAX_BACKEND_KEY": JSON.stringify(
      process.env.SCALERMAX_BACKEND_KEY,
    ),
  },
});
