import fs from 'fs/promises';
import { collectTypes } from '../../../scripts/collect-types.mjs';

const types = {
  '__': 'generated with extract-types.mjs',
};
await collectTypes('./node_modules/near-sdk-js', types);

await fs.mkdir('./dist', { recursive: true });
await fs.writeFile('./dist/types.json', JSON.stringify(types, null, 2), 'utf-8');
