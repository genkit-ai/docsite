import fs from 'fs/promises';
import path from 'path';

const directoryPath = 'src/content/docs/unified-docs';

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let changed = false;

    if (content.includes('<Tabs syncKey="language">')) {
      changed = true;

      content = content.replace(/<Tabs syncKey="language">/g, '<LangTabs>');
      content = content.replace(/<\/Tabs>/g, '</LangTabs>');

      content = content.replace(/<TabItem label="JavaScript"[^>]*>/g, '<LangTabItem lang="js">');
      content = content.replace(/<TabItem label="Go"[^>]*>/g, '<LangTabItem lang="go">');
      content = content.replace(/<TabItem label="Python"[^>]*>/g, '<LangTabItem lang="python">');
      content = content.replace(/<\/TabItem>/g, '</LangTabItem>');

      const importRegex = /import { Tabs, TabItem } from '@astrojs\/starlight\/components';/g;
      const newImport =
        "import LangTabs from '../../../components/LangTabs.astro';\nimport LangTabItem from '../../../components/LangTabItem.astro';";

      if (importRegex.test(content)) {
        content = content.replace(importRegex, newImport);
      }
    }

    if (changed) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

async function walk(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const res = path.resolve(dir, file.name);
    if (file.isDirectory()) {
      await walk(res);
    } else {
      if (res.endsWith('.mdx')) {
        await processFile(res);
      }
    }
  }
}

console.log('Starting tab replacement script...');
walk(directoryPath).then(() => {
  console.log('Tab replacement script finished.');
});
