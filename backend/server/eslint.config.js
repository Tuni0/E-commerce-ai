import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { globals: globals.node } }, // Use globals.node for Node.js environment
  pluginJs.configs.recommended,
];
