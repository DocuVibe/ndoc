const fs = require('fs');
const { parseNodeDoc } = require('./parser');
const { renderHTML } = require('./render');
const { startServer } = require('./server');

function runCLI() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node index.js <build|serve> <input.ndoc>');
    process.exit(1);
  }

  const command = args[0];
  const inputFile = args[1];

  if (command === 'build') {
    const doc = parseNodeDoc(inputFile);
    const html = renderHTML(doc);
    fs.writeFileSync('output.html', html);
    console.log('Documentation generated at output.html');
  } else if (command === 'serve') {
    startServer(inputFile);
  } else {
    console.error('Unknown command. Use "build" or "serve".');
    process.exit(1);
  }
}

module.exports = { runCLI };