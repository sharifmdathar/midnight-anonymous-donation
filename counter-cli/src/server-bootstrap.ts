// Load server with try/catch so we see real errors (e.g. TS compile errors from api.ts).
import util from 'node:util';

try {
  await import('./server.ts');
} catch (err) {
  console.error('Failed to start server:', err instanceof Error ? err.message : String(err));
  if (err instanceof Error && err.stack) console.error(err.stack);
  console.error(util.inspect(err, { depth: 5 }));
  process.exit(1);
}
