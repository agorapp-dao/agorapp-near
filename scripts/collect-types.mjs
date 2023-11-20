import fs from 'fs/promises';
import path from 'path';

export async function collectTypes(dir, types) {
  console.log(`Going to collect d.ts files from ${dir}`);
  dir = path.resolve(dir);
  await collectTypesInner(dir, '.', types);
}

async function collectTypesInner(fullPath, shortPath, types) {
  const files = await fs.readdir(fullPath, { withFileTypes: true });
  for (let file of files) {
    if (file.isDirectory()) {
      await collectTypesInner(`${fullPath}/${file.name}`, `${shortPath}/${file.name}`, types);
    } else if (file.isSymbolicLink()) {
      let realPath = await fs.readlink(`${fullPath}/${file.name}`);
      realPath = path.resolve(fullPath, realPath);
      const stat = await fs.stat(realPath);
      if (stat.isDirectory()) {
        await collectTypesInner(`${fullPath}/${file.name}`, `${shortPath}/${file.name}`, types);
      }
    }

    if (file.name.endsWith('.d.ts') || file.name === 'package.json') {
      const content = await fs.readFile(`${fullPath}/${file.name}`, 'utf-8');

      let dir = shortPath;
      if (!shortPath.startsWith('./node_modules') && !shortPath.startsWith('node_modules')) {
        // make sure types are stored in node_modules to be resolved properly
        const nodeModulesIndex = fullPath.lastIndexOf('node_modules')
        if (nodeModulesIndex === -1) {
          throw new Error(`Could not find node_modules in ${fullPath}`);
        }
        dir = './' + fullPath.substring(nodeModulesIndex);
      }

      console.log(`Found ${dir}/${file.name}`);
      types[`${dir}/${file.name}`] = content;
    }
  }
}
