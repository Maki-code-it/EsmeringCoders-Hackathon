import { readFileSync } from 'node:fs';
import { extractWithLumenOcr } from './src/modules/documents/ocrService.js';

const [, , filePath, fileType] = process.argv;
const result = await extractWithLumenOcr({
  fileBuffer: readFileSync(filePath),
  fileName: filePath.split(/[\\/]/).pop(),
  fileType,
  documentType: 'payslip',
});
console.log(JSON.stringify(result, null, 2));
