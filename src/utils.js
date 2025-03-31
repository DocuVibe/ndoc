/**
 * Utility functions for NodeDoc.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Loads and parses ndoc.yml config file. Throws an error if not found.
 * @returns {object} Config object.
 */
function loadConfig() {
  const configPath = path.join(process.cwd(), 'ndoc.yml');
  if (!fs.existsSync(configPath)) {
    throw new Error('ndoc.yml not found in project root. Please create one.');
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return yaml.load(configContent);
  } catch (err) {
    throw new Error(`Error parsing ndoc.yml: ${err.message}`);
  }
}

/**
 * Creates the base index.html file with config-based customization.
 * @returns {string} HTML content.
 */
function createIndexHTML() {
  const config = loadConfig();
  const cssLinks = config.css.map(url => `<link rel="stylesheet" href="${url}">`).join('\n    ');
  const header = config.header.replace('{{title}}', config.title);
  const footer = config.footer.replace('{{title}}', config.title);
  const navItems = config.nav.map(item => `<li><a href="${item.path}" data-path="${item.path}">${item.title}</a></li>`).join('\n          ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  ${cssLinks}
  <style>
    #app { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; display: flex; }
    aside { width: 250px; padding: 1rem; background: #f5f5f5; }
    #content { flex: 1; padding: 1rem; }
    .function { margin-bottom: 2rem; }
    #search { width: 100%; margin-bottom: 1rem; }
    header, footer { padding: 1rem; background: #f0f0f0; }
  </style>
</head>
<body>
  <div id="app">
    ${header}
    <main>
      <aside>
        <input type="text" id="search" placeholder="Search...">
        <nav>
          <ul id="sidebar">
            ${navItems}
          </ul>
        </nav>
      </aside>
      <div id="content"></div>
    </main>
    ${footer}
  </div>
  <script src="/render.js"></script>
</body>
</html>
  `;
}

/**
 * Converts Markdown-inspired .ndoc content to standard .ndoc format.
 * @param {string} ndocContent - The .ndoc file content with Markdown syntax.
 * @returns {string} Standard .ndoc content.
 */
function convertMarkdownStyleToNdoc(ndocContent) {
  const lines = ndocContent.split('\n').map(line => line.trim());
  let converted = '';
  let inFunction = false;

  lines.forEach(line => {
    if (!line) {
      converted += '\n';
      return;
    }

    if (line.startsWith('# ')) {
      const moduleName = line.slice(2).trim();
      converted += `[module: ${moduleName}]\n`;
    } else if (line.startsWith('## ')) {
      const funcName = line.slice(3).trim();
      converted += `\n[function: ${funcName}]\n`;
      inFunction = true;
    } else if (line.match(/^\s*- \*\*(\w+)\*\* \(`(\w+)`\):\s*(.+)$/)) {
      const match = line.match(/^\s*- \*\*(\w+)\*\* \(`(\w+)`\):\s*(.+)$/);
      const [_, name, type, desc] = match;
      converted += `param: ${name} (${type}) - ${desc}\n`;
    } else if (line.match(/^\s*\*\*Returns\*\*:\s*`(\w+)`\s*-\s*(.+)$/)) {
      const match = line.match(/^\s*\*\*Returns\*\*:\s*`(\w+)`\s*-\s*(.+)$/);
      const [_, type, desc] = match;
      converted += `return: ${type} - ${desc}\n`;
      inFunction = false;
    } else if (!line.startsWith('-') && !line.startsWith('**Returns**') && line) {
      converted += `desc: ${line}\n`;
    } else {
      converted += `${line}\n`;
    }
  });

  return converted.trim();
}

module.exports = { createIndexHTML, convertMarkdownStyleToNdoc };