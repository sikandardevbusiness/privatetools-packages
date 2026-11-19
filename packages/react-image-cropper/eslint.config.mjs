import { config as baseInternalConfig } from "@repo/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
    ...baseInternalConfig,
    {
        ignores: ["dist/**", "node_modules/**", "coverage/**"],
    },
];
