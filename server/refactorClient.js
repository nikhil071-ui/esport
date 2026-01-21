const fs = require('fs');
const path = require('path');

const CLIENT_DIR = path.join(__dirname, '../client/src');
const TARGET_STRING = "http://localhost:5000";
const REPLACEMENT_STRING = "import.meta.env.VITE_API_URL";

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            replaceInFile(filePath);
        }
    });
}

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file contains the string (checking both simple quotes and backticks contexts)
    // Case 1: 'http://localhost:5000/api/...' -> `${import.meta.env.VITE_API_URL}/api/...`
    // Wait, simple replacement of http://localhost:5000 with the variable inside a string literal won't work
    // if the string was single quoted: 'http://...'.
    // It needs to become template literal `${...}` or concatenation.
    
    // Easier approach: 
    // Just replace the string, but we need to handle the quoting.
    // If it's a template literal `http://localhost:5000...`, we can replace with ${import.meta.env.VITE_API_URL}
    // If it's a string 'http://localhost:5000...', we need to change it to template literal OR concatenation.
    
    // Regex strategy is safer.
    
    // 1. Handle backticks: `http://localhost:5000 -> `${import.meta.env.VITE_API_URL}
    if (content.includes('`http://localhost:5000')) {
        content = content.replace(/`http:\/\/localhost:5000/g, '`${import.meta.env.VITE_API_URL}');
        console.log(`Updated backticks in: ${filePath}`);
    }
    
    // 2. Handle single/double quotes: "http://localhost:5000... or 'http://localhost:5000...
    // We can replace the whole string with a template literal.
    // Regex: (["'])http:\/\/localhost:5000(.*?)(\1)
    // Replace with: `${import.meta.env.VITE_API_URL}$2`
    // Note: This changes 'url' to `url`.
    
    const quoteRegex = /(['"])http:\/\/localhost:5000(.*?)\1/g;
    if (quoteRegex.test(content)) {
        content = content.replace(quoteRegex, '`${import.meta.env.VITE_API_URL}$2`');
        console.log(`Updated quotes in: ${filePath}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Starting refactor...");
walkDir(CLIENT_DIR);
console.log("Refactor complete.");
