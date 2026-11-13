import { readFileSync } from 'node:fs';
import { env } from './src/config/env.js';

const base = 'https://api.staging.nonlive.lumen.bayanichain.tech/ocr/documents';
const auth = { 'lumen-api-key': env.lumen.apiKey, 'lumen-api-secret': env.lumen.apiSecret };

// Use a real image if given, else a tiny PNG
const filePath = process.argv[2];
const bytes = filePath
  ? readFileSync(filePath)
  : Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
const type = filePath?.match(/\.jpe?g$/i) ? 'image/jpeg' : 'image/png';

const res = await fetch(base, {
  method: 'POST',
  headers: { ...auth, 'Content-Type': type, 'x-lumen-document-name': 'probe' + (type === 'image/png' ? '.png' : '.jpg') },
  body: bytes,
});
const text = await res.text();
console.log('create', res.status, text.slice(0, 800));
const id = JSON.parse(text)?.data?.DocumentID;
if (!id) process.exit(0);

for (let i = 0; i < 12; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const s = await fetch(`${base}/${id}`, { headers: auth });
  const doc = (await s.json()).data;
  console.log('status', doc?.Status, 'pages', doc?.PageCount);
  if (doc && !['PENDING', 'QUEUED', 'READING', 'PROCESSING'].includes(doc.Status)) break;
}

for (const p of ['pages', 'review']) {
  const r = await fetch(`${base}/${id}/${p}`, { headers: auth });
  console.log(`\n${p}`, r.status, (await r.text()).slice(0, 2500));
}
