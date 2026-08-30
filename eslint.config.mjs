import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    // This repository predates the React Compiler lint checks introduced by
    // the current Next.js preset. Surface those migration items without
    // making the existing application impossible to validate and deploy.
    rules: {
      "@next/next/no-html-link-for-pages": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
