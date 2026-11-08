/**
 * Static Linter & Code Quality Validator
 * Sprint 15 CI/CD Pipeline Linter
 */
const fs = require('fs');
const path = require('path');

console.log('[LINTER] Running static code quality checks on Sprint 15 codebase...');

const dirsToScan = ['src', 'tests'];
let errorCount = 0;
let fileCount = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.name.endsWith('.js')) {
      fileCount++;
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Basic syntax validation
      try {
        new Function(content);
      } catch (err) {
        console.error(`[LINT ERROR] Syntax error in ${fullPath}:`, err.message);
        errorCount++;
      }

      // Check for debugger or forbidden keywords
      if (content.includes('debugger;')) {
        console.error(`[LINT ERROR] Forbidden 'debugger' statement in ${fullPath}`);
        errorCount++;
      }
    }
  }
}

dirsToScan.forEach(scanDir);

console.log(`[LINTER] Scanned ${fileCount} files.`);
if (errorCount > 0) {
  console.error(`[LINTER FAILED] ${errorCount} lint error(s) detected.`);
  process.exit(1);
} else {
  console.log('[LINTER PASSED] All files meet production quality standards.');
  process.exit(0);
}
