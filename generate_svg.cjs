const fs = require('fs');
const img = fs.readFileSync('public/logo.png');
const b64 = img.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <style>
    @media (prefers-color-scheme: dark) { .logo { filter: invert(1) brightness(1.2); } }
  </style>
  <image class="logo" href="data:image/png;base64,${b64}" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>`;
fs.writeFileSync('public/logo.svg', svg);
console.log('Done!');
