// Flat config (ESLint 9). Una sola fuente para todo el monorepo.
// Hace cumplir, además de las reglas habituales, la INVARIANTE DE ARQUITECTURA:
// "ningún módulo puede importar rutas internas de otro: solo @haku/<modulo>".
import tseslint from "typescript-eslint";
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.pnpm-store/**",
      "**/coverage/**",
      "**/*.config.{js,mjs,cjs,ts}",
      "**/postcss.config.*",
      "**/tailwind.config.*",
    ],
  },

  // Base TS recomendado (sin type-info para mantenerlo rápido en CI).
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // Frontera modular: prohibir imports profundos entre paquetes @haku/*.
      // (TypeScript ya lo dificulta, pero esto lo documenta y lo bloquea de plano.)
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@haku/*/src", "@haku/*/src/*", "@haku/*/dist", "@haku/*/dist/*"],
              message:
                "Importá solo la API pública del módulo (`@haku/<modulo>`), nunca rutas internas. Ver SPEC.md §3.",
            },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Permitimos `any` puntual en boundaries de supabase-js (documentado en código).
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Reglas específicas para `web/` (Next.js + React Hooks).
  {
    files: ["web/**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      // App Router (no /pages) — silenciamos la regla que se queja del directorio.
      "@next/next/no-html-link-for-pages": "off",
      // Las páginas hoy no necesitan <Image>; venue/event card piden URLs externas.
      "@next/next/no-img-element": "off",
    },
  },

  // En tests permitimos non-null assertion (`!`) y mocks tipados con casts.
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);
