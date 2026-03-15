// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix: Remove 'mjs' from source extensions to prevent Metro from
// bundling ESM versions of packages (e.g. zustand/esm/middleware.mjs)
// which use import.meta.env — unsupported by Metro's web bundler.
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'mjs'
);

module.exports = config;
