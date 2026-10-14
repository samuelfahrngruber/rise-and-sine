import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import { playwright } from "vite-plus/test/browser-playwright";

export default defineConfig({
  base: "./",
  plugins: [vue()],
  build: {
    rolldownOptions: {
      input: { main: "index.html", accurate: "accurate/index.html" },
    },
  },
  test: {
    projects: [
      { extends: true, test: { name: "unit", include: ["src/**/*.test.ts"] } },
      {
        extends: true,
        test: {
          name: "ui",
          include: ["tests/**/*.browser.test.ts"],
          browser: {
            enabled: true,
            provider: playwright({ contextOptions: { timezoneId: "Europe/Vienna" } }),
            headless: true,
            instances: [{ browser: "chromium" }],
            viewport: { width: 1440, height: 1100 },
          },
        },
      },
    ],
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
});
