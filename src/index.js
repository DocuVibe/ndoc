#!/usr/bin/env node
/**
 * NodeDoc CLI: Entry point for the documentation generator.
 * Requires ndoc.yml for configuration.
 */

const fs = require('fs');
const path = require('path');
const { startServer } = require('./server');
const { createIndexHTML } = require('./utils');

const args = process.argv.slice(2);
const command = args[0] || 'serve'; // Default to 'serve'

if (command === 'serve') {
  startServer();
} else if (command === 'build') {
  const outputDir = 'build';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  try {
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) throw new Error('No docs/ directory found.');
    copyDir(docsDir, outputDir);
    fs.writeFileSync(path.join(outputDir, 'index.html'), createIndexHTML()); // Requires ndoc.yml
    fs.copyFileSync(path.join(__dirname, 'render.js'), path.join(outputDir, 'render.js'));
    console.log('Documentation built at build/index.html');
  } catch (err) {
    console.error('Build failed:', err.message);
    process.exit(1);
  }
} else {
  console.error('Unknown command. Use "serve" or "build".');
  process.exit(1);
}

/**
 * Recursively copy a directory.
 * @param {string} src - Source directory.
 * @param {string} dest - Destination directory.
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}