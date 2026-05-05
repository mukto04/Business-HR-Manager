const fs = require('fs');

const content = fs.readFileSync('src/lib/i18n/dictionaries.ts', 'utf-8');
const lines = content.split('\n');

let currentLang = null;
let seenKeys = new Set();
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.match(/^\s*en:\s*\{/)) {
    currentLang = 'en';
    seenKeys = new Set();
  } else if (line.match(/^\s*es:\s*\{/)) {
    currentLang = 'es';
    seenKeys = new Set();
  } else if (line.match(/^\s*ar:\s*\{/)) {
    currentLang = 'ar';
    seenKeys = new Set();
  } else if (line.match(/^\s*\},?\s*$/) && currentLang) {
    currentLang = null;
  }
  
  if (currentLang) {
    const match = line.match(/^\s*"([^"]+)":/);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        console.log(`Removing duplicate key in ${currentLang}: "${key}"`);
        continue; // skip this line
      } else {
        seenKeys.add(key);
      }
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync('src/lib/i18n/dictionaries.ts', newLines.join('\n'), 'utf-8');
console.log('Successfully fixed duplicates!');
