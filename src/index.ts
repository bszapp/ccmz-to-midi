import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ccxmlToXml from './app.ts';
import type { CCXML } from './ccxml.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
    const inputPath = path.join(__dirname, '../data/score.json');
    const outputPath = path.join(__dirname, '../data/output.xml');

    const data = await fs.readFile(inputPath, 'utf-8');
    const score = JSON.parse(data) as CCXML;

    const xml = ccxmlToXml(score);
    await fs.writeFile(outputPath, xml, 'utf-8');

    console.log("输出到:", outputPath);
};

run();