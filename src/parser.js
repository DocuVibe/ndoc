const fs = require('fs');
const { Documentation, FunctionDoc } = require('./model');

function parseNodeDoc(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8').split('\n');
  const doc = new Documentation();
  let currentFunction = null;

  content.forEach(line => {
    line = line.trim();
    if (!line) return; // Skip empty lines

    if (line.startsWith('[module:')) {
      doc.module.name = line.slice(8, -1).trim();
    } else if (line.startsWith('desc:') && !currentFunction) {
      doc.module.desc = line.slice(5).trim();
    } else if (line.startsWith('[function:')) {
      currentFunction = new FunctionDoc(line.slice(10, -1).trim());
      doc.module.functions.push(currentFunction);
    } else if (currentFunction) {
      if (line.startsWith('desc:')) {
        currentFunction.desc = line.slice(5).trim();
      } else if (line.startsWith('param:')) {
        const paramMatch = line.slice(6).match(/(\w+)\s*\((\w+)\)\s*-\s*(.+)/);
        if (paramMatch) {
          currentFunction.params.push({
            name: paramMatch[1].trim(),
            type: paramMatch[2].trim(),
            desc: paramMatch[3].trim()
          });
        }
      } else if (line.startsWith('return:')) {
        const returnMatch = line.slice(7).match(/(\w+)\s*-\s*(.+)/);
        if (returnMatch) {
          currentFunction.return = {
            type: returnMatch[1].trim(),
            desc: returnMatch[2].trim()
          };
        }
      }
    }
  });

  return doc;
}

module.exports = { parseNodeDoc };