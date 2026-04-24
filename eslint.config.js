import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "accessibility-backend/**"]
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}", "public/**/*.js", "*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2024,
        CSS: "readonly",
        chrome: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }]
    }
  },
  {
    files: ["src/**/*.test.{js,jsx}", "src/**/setupTests.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.vitest
      }
    }
  }
];
