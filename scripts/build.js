#!/usr/bin/env bun

/**
 * Advanced build script with multiple output formats
 * Preserves JSDoc comments in all builds
 */

import { rmSync } from "fs";

// Clean dist directory
try {
  rmSync("./dist", { recursive: true, force: true });
  console.log("✓ Cleaned dist directory");
} catch (e) {
  // Directory doesn't exist, that's fine
}

/**
 * Build configuration for different formats
 */
const builds = [
  {
    name: "ESM (Development)",
    config: {
      entrypoints: ["./src/index.js"],
      outdir: "./dist",
      format: "esm",
      minify: false,
      sourcemap: "external",
      naming: "[dir]/[name].js",
    },
  },
  {
    name: "ESM (Production)",
    config: {
      entrypoints: ["./src/index.js"],
      outdir: "./dist",
      format: "esm",
      minify: {
        whitespace: true,
        identifiers: false, // Keep names for JSDoc
        syntax: true,
      },
      sourcemap: "external",
      naming: "[dir]/[name].min.js",
    },
  },
  {
    name: "CommonJS",
    config: {
      entrypoints: ["./src/index.js"],
      outdir: "./dist",
      format: "cjs",
      minify: false,
      sourcemap: "external",
      naming: "[dir]/[name].cjs",
    },
  },
  {
    name: "IIFE (Browser)",
    config: {
      entrypoints: ["./src/index.js"],
      outdir: "./dist",
      format: "iife",
      minify: false,
      sourcemap: "external",
      naming: "[dir]/[name].iife.js",
      target: "browser",
    },
  },
];

/**
 * Run all builds sequentially
 */
for (const { name, config } of builds) {
  console.log(`\nBuilding ${name}...`);

  const result = await Bun.build({
    target: "browser",
    ...config,
  });

  if (!result.success) {
    console.error(`✗ ${name} build failed`);
    for (const message of result.logs) {
      console.error(message);
    }
    process.exit(1);
  }

  console.log(`✓ ${name} complete`);

  for (const output of result.outputs) {
    const size = (output.size / 1024).toFixed(2);
    console.log(`  - ${output.path} (${size} KB)`);
  }
}

console.log("\n✓ All builds completed successfully");
