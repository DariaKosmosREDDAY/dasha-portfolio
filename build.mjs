import { cp, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'script.js']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
await cp(path.join(root, 'public'), path.join(output, 'public'), { recursive: true });
await cp(path.join(root, 'projects'), path.join(output, 'projects'), { recursive: true });
await cp(path.join(root, 'cv'), path.join(output, 'cv'), { recursive: true });
console.log('Сайт готов к публикации: dist/');
