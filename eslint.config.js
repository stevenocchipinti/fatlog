//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"
import reactHooks from "eslint-plugin-react-hooks"

export default [
  // Root JS config files aren't in the TS project (no allowJs), so the
  // type-aware parser can't lint them.
  { ignores: ["*.config.js", "dist/**"] },
  ...tanstackConfig,
  reactHooks.configs.flat["recommended-latest"],
  {
    rules: {
      // New in react-hooks 7. The drawers reset their form state in an
      // effect when they open; refactoring them to remount instead is a
      // separate change, so keep this visible as a warning until then.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
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
