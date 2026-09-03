import base from "../../prettier.config.cjs"

/**
 * The root config points the Tailwind plugin at apps/v4's stylesheet, which
 * imports `shadcn/tailwind.css` and therefore needs that workspace package
 * built first. This app has its own stylesheet and no such dependency, so it
 * points at its own — same rules, one less build step.
 *
 * @type {import('prettier').Config}
 */
const config = {
  ...base,
  tailwindStylesheet: "./app/globals.css",
}

export default config
