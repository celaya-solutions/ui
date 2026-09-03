import nextVitals from "eslint-config-next/core-web-vitals"
import tseslint from "typescript-eslint"

const eslintConfig = tseslint.config(
  // Drop the @typescript-eslint plugin from next/typescript so it is not
  // registered twice alongside tseslint.configs.recommended — same reason as
  // apps/v4.
  ...nextVitals.map((config) =>
    config.name === "next/typescript" ? { ...config, plugins: {} } : config
  ),
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts"],
  },
  {
    // components/ui/** is the shadcn registry copied in verbatim. Keep it
    // byte-identical to upstream so it can be re-synced; the desk's own code
    // above this line is held to the full rule set.
    files: ["components/ui/**"],
    rules: { "react-hooks/purity": "off" },
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  }
)

export default eslintConfig
