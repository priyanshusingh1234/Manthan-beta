import react from "eslint-plugin-react";
import reactNative from "eslint-plugin-react-native";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react,
      "react-native": reactNative,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react-native/no-unused-styles": "warn",
      "react-native/no-inline-styles": "warn",
      "no-undef": "off", // TypeScript handles this
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
