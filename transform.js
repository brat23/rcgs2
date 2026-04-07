const fs = require('fs');
const path = 'Y:/RCGS2/rcgs2/src/config/default_layout.js';
let content = fs.readFileSync(path, 'utf8');

let count = 0;
const target = '"file": "fixture/4sh.glb"';
const replacement = '"file": "fixture/4fh.glb"';

// Split the content by the target string
let parts = content.split(target);
let newContent = parts[0];

for (let i = 1; i < parts.length; i++) {
    count++;
    // If count is even (2nd, 4th, ...), use replacement
    if (count % 2 === 0) {
        newContent += replacement + parts[i];
    } else {
        newContent += target + parts[i];
    }
}

fs.writeFileSync(path, newContent);
console.log('Successfully updated file.');
