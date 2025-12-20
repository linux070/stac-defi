const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Swap.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix getTokenAddress to return null for placeholder '0x' addresses
content = content.replace(
  /  const getTokenAddress = \(tokenSymbol\) => \{[\s\S]*?return token\.address \|\| null;\n  \};/,
  `  const getTokenAddress = (tokenSymbol) => {
    if (!chainId || !TOKENS[tokenSymbol]) return null;
    const token = TOKENS[tokenSymbol];
    if (token.address && typeof token.address === 'object') {
      const addr = token.address[chainId] || null;
      // Return null for placeholder addresses ('0x' or '0x0...')
      return (addr && addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000') ? addr : null;
    }
    const addr = token.address || null;
    // Return null for placeholder addresses
    return (addr && addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000') ? addr : null;
  };`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Token address fix applied!');
