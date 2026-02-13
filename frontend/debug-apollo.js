import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);

try {
    const pkgJsonPath = require.resolve('@apollo/client/package.json');
    console.log('Package JSON Path:', pkgJsonPath);

    const root = path.dirname(pkgJsonPath);
    console.log('Root:', root);

    const coreIndex = path.resolve(root, 'core/index.js');
    console.log('Core Index Path:', coreIndex);
    console.log('Core Index Exists:', fs.existsSync(coreIndex));

    const linkCoreIndex = path.resolve(root, 'link/core/index.js');
    console.log('Link Core Index Exists:', fs.existsSync(linkCoreIndex));

} catch (e) {
    console.error('Error:', e);
}
