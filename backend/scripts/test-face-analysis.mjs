import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const imgPath = path.join(__dirname, '_test-face.png');
fs.writeFileSync(imgPath, png);

const { analyzeFace } = await import('../dist/services/openai.js');
const started = Date.now();
const result = await analyzeFace(imgPath);
console.log('demo:', result.demo);
console.log('overall_score:', result.data.overall_score);
console.log('elapsed:', Date.now() - started, 'ms');