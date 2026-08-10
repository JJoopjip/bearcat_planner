// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Mirror the "@/*" -> "src/*" alias from tsconfig.json so Metro can
// resolve it too, not just the TypeScript compiler.
config.resolver.alias = {
  "@": path.resolve(__dirname, "src"),
};

module.exports = config;
