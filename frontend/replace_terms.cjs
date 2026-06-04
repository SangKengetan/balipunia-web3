const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replacements
  // "Mapunia" -> "Mepunia"
  content = content.replace(/\bMapunia\b/g, 'Mepunia');
  content = content.replace(/\bmapunia\b/g, 'mepunia');
  
  // "Berdonasi" -> "Mepunia"
  content = content.replace(/\bBerdonasi\b/g, 'Mepunia');
  content = content.replace(/\bberdonasi\b/g, 'mepunia');
  
  // "Donasi" -> "Punia" (but avoid changing code variables like `donasiList`, etc)
  // Usually user facing is capitalized or spaces around it.
  content = content.replace(/\bDonasi\b/g, 'Punia');
  
  // For lower case "donasi", it's risky (might be variables, api paths).
  // I will only replace "donasi" when it's part of a string or JSX text.
  // Actually, replacing all "donasi" to "punia" might be too aggressive for code.
  // Let's replace cases like "donasi " or " donasi"
  content = content.replace(/ donasi /g, ' punia ');
  content = content.replace(/ donasi\b/g, ' punia');
  content = content.replace(/\bdonasi /g, 'punia ');
  content = content.replace(/>donasi</g, '>punia<');
  content = content.replace(/"donasi"/g, '"punia"');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

walkDir(path.join(__dirname, 'src'), processFile);
console.log("Replacement complete.");
