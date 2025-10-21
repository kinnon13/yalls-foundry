import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Task 15: Treat warnings as errors, enforce clean code
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Prevent Web Speech TTS usage (use useVoice server TTS only)
      "no-restricted-globals": ["error",
        { "name": "speechSynthesis", "message": "Use useVoice({ role }) with server TTS only. No browser TTS allowed." },
        { "name": "SpeechSynthesisUtterance", "message": "Use useVoice({ role }) with server TTS only. No browser TTS allowed." }
      ],
    },
  },
  // Allow console in scripts
  {
    files: ["scripts/**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
    },
  },
);
