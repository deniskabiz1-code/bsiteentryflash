import { execSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set on Render');
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.log('DIRECT_URL not set — using DATABASE_URL for schema push');
}

try {
  console.log('Running prisma db push...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env: process.env });
} catch {
  console.error('ERROR: prisma db push failed. Check DATABASE_URL / DIRECT_URL in Render env vars.');
  process.exit(1);
}

console.log('Starting server...');
execSync('node dist/index.js', { stdio: 'inherit', env: process.env });