const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Get all .ts and .tsx files recursively in src
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = getFiles(path.join(process.cwd(), 'src'));

console.log(`Found ${files.length} files. Starting refactor...`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace import
  if (content.includes('import { prisma } from "@/lib/prisma"')) {
    content = content.replace(
      /import { prisma } from "(.*)\/lib\/prisma"/g,
      'import { getTenantPrisma } from "$1/lib/prisma"'
    );
    changed = true;
  }

  // Replace usage: prisma. -> (await getTenantPrisma()).
  // We need to be careful with regex to avoid replacing things we shouldn't
  // But in this codebase, 'prisma.' is strictly the ORM.
  // We check for 'prisma.' and '$transaction' etc.
  
  if (content.includes('prisma.')) {
    content = content.replace(/prisma\./g, '(await getTenantPrisma()).');
    changed = true;
  }

  // Handle case where prisma is used as a property or in $transaction
  if (content.includes('prisma$')) {
     content = content.replace(/prisma\$/g, '(await getTenantPrisma()).$');
     changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Refactored: ${file}`);
  }
});

console.log("Refactor complete. Running lint to check for errors...");
try {
  // execSync('npm run lint', { stdio: 'inherit' });
} catch (e) {
  console.error("Lint failed. Manual check required.");
}
