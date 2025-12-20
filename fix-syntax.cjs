const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Swap.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove extra closing braces
content = content.replace(/\n                }\n              }\)/g, '\n              })');
content = content.replace(/\n            }\n          }/g, '\n          }');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Syntax errors fixed!');
