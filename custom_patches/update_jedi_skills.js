// One-shot script: mark all "jedi*" skills as GOD_ONLY + IS_HIDDEN in skills.csv.
// Run with: node update_jedi_skills.js
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'unpacked_tres', 'datatables', 'skill', 'skills.csv');
const text = fs.readFileSync(src, 'utf8');

// Preserve line endings as found
const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(/\r?\n/);

// Parse a single CSV line into fields, respecting double-quoted strings.
// Does NOT handle escaped quotes (""); the skills.csv does not use them.
function parseCsvLine(line) {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuotes = !inQuotes;
            cur += c;
        } else if (c === ',' && !inQuotes) {
            fields.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    fields.push(cur);
    return fields;
}

function joinCsvLine(fields) {
    return fields.join(',');
}

// Column indices (0-based) from header row:
// 0 NAME, 1 PARENT, 2 GRAPH_TYPE, 3 GOD_ONLY, 4 IS_TITLE, 5 IS_PROFESSION, 6 IS_HIDDEN
const GOD_ONLY = 3;
const IS_HIDDEN = 6;

let modified = 0;
const out = lines.map((line, idx) => {
    // Skip header (0) and type row (1); also skip blank trailing line
    if (idx < 2 || line.length === 0) return line;
    const fields = parseCsvLine(line);
    const name = fields[0];
    if (name && name.startsWith('"jedi')) {
        fields[GOD_ONLY] = 'true';
        fields[IS_HIDDEN] = 'true';
        modified++;
        return joinCsvLine(fields);
    }
    return line;
});

fs.writeFileSync(src, out.join(lineEnding), 'utf8');
console.log(`Modified ${modified} rows`);
