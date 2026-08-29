const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, 'server/db');
const files = fs.readdirSync(destDir);

for (const file of files) {
  if (file.endsWith('.ts')) {
    const filePath = path.join(destDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\\n/g, '\n');
    fs.writeFileSync(filePath, content);
  }
}
console.log('Fixed newlines');
