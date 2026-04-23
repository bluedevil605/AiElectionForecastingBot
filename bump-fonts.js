const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client/src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Bump sizes up
  content = content.replace(/text-\[8px\]/g, 'TEMP_10');
  content = content.replace(/text-\[9px\]/g, 'TEMP_11');
  content = content.replace(/text-\[10px\]/g, 'TEMP_12');
  content = content.replace(/text-\[11px\]/g, 'TEMP_13');
  
  // Note: we only want to bump text-xs to text-sm, text-sm to text-base
  content = content.replace(/text-sm /g, 'text-base ');
  content = content.replace(/text-sm"/g, 'text-base"');
  
  content = content.replace(/text-xs /g, 'text-sm ');
  content = content.replace(/text-xs"/g, 'text-sm"');

  content = content.replace(/TEMP_10/g, 'text-[10px]');
  content = content.replace(/TEMP_11/g, 'text-xs');
  content = content.replace(/TEMP_12/g, 'text-sm');
  content = content.replace(/TEMP_13/g, 'text-sm');

  fs.writeFileSync(filePath, content);
}
console.log('Bumped typography sizes across components.');
