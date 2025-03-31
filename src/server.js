/**
 * NodeDoc Server: Provides a live server with routing for .ndoc files.
 * Requires ndoc.yml for configuration.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const { createIndexHTML, convertMarkdownStyleToNdoc } = require('./utils');

function startServer(port = 3000) {
  const docsDir = path.join(process.cwd(), 'docs');

  // Ensure docs/ exists
  if (!fs.existsSync(docsDir)) {
    console.error('No docs/ directory found. Please create one with .ndoc files.');
    process.exit(1);
  }

  // Explicitly require ndoc.yml at startup
  try {
    createIndexHTML(); // This will throw if ndoc.yml is missing
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    let urlPath = req.url === '/' ? '/index' : req.url;
    const ndocFilePath = path.join(docsDir, `${urlPath.replace(/\.ndoc$/, '')}.ndoc`);

    if (req.url === '/' || req.url.match(/^\/[\w-\/]*$/)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(createIndexHTML());
    } else if (req.url.match(/\.ndoc$/)) {
      if (fs.existsSync(ndocFilePath)) {
        const inputContent = fs.readFileSync(ndocFilePath, 'utf-8');
        const ndocContent = convertMarkdownStyleToNdoc(inputContent);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(ndocContent);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404: .ndoc file not found');
      }
    } else if (req.url === '/render.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(fs.readFileSync(path.join(__dirname, 'render.js'), 'utf-8'));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404: Not Found');
    }
  });

  const wss = new WebSocket.Server({ server });
  wss.on('connection', ws => {
    console.log('Client connected for live updates');
  });

  chokidar.watch(docsDir, { ignored: /(^|[/\\])\../ }).on('change', () => {
    console.log('File changed, reloading...');
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    });
  });

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = { startServer };