//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"
import reactHooks from "eslint-plugin-react-hooks"

export default [
  // Root JS config files aren't in the TS project (no allowJs), so the
  // type-aware parser can't lint them.
  { ignores: ["*.config.js", "dist/**"] },
  ...tanstackConfig,
  reactHooks.configs["recommended-latest"],
  {
    // Must be scoped to TS files: tanstackConfig only registers the
    // @typescript-eslint plugin for those, so an unscoped rule here errors.
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/array-type": [
        "warn",
        {
          default: "array",
        },
      ],
    },
  },
]
