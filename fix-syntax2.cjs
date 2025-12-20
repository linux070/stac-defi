const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Swap.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the extra closing brace on line 296
content = content.replace(
  /            setShowSwapDetails\(true\);\n          }\n          }/,
  '            setShowSwapDetails(true);\n          }\n        }'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Syntax error fixed!');
