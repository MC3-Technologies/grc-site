import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        assessment: resolve(__dirname, "assessment/index.html"),
        assessments: resolve(__dirname, "assessments/index.html"),
        auth: resolve(__dirname, "auth/index.html"),
        faq: resolve(__dirname, "faq/index.html"),
        osint: resolve(__dirname, "osint/index.html"),
        resources: resolve(__dirname, "resources/index.html"),
        forgotPassword: resolve(__dirname, "forgot-password/index.html"),
        signIn: resolve(__dirname, "signin/index.html"),
        signUp: resolve(__dirname, "signup/index.html"),
        completedAssessment: resolve(
          __dirname,
          "completed-assessment/index.html",
        ),
        // example-page-directory: resolve(__dirname, 'path/to/page/index.html'),
      },
    },
  },
});
