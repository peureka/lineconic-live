#!/usr/bin/env node
import fs from 'fs';
import { buildRunOfShow } from './lib/ros-builder.js';

const CSV_PATH = 'SHOW_MASTER_V3.csv';
const SHOW_NAME = 'THE SPLIT — TABLE FORMAT V3';
const FIREBASE_URL = 'https://lineconic-live-default-rtdb.europe-west1.firebasedatabase.app';

console.log(`Parsing ${CSV_PATH}...`);
const csv = fs.readFileSync(CSV_PATH, 'utf8');
const ros = buildRunOfShow(csv, SHOW_NAME);

// Log section summary
ros.sections.forEach(s => {
  console.log(`  ${s.name} — ${s.slides.length} slides`);
});
const totalSlides = ros.sections.reduce((a, s) => a + s.slides.length, 0);
console.log(`Total: ${totalSlides} slides across ${ros.sections.length} sections`);

// Write JSON to disk
console.log('Writing ros-v1.json...');
fs.writeFileSync('ros-v1.json', JSON.stringify(ros, null, 2));

// Upload to Firebase
console.log('Uploading to Firebase...');
const url = `${FIREBASE_URL}/shows/${ros.id}.json`;
const resp = await fetch(url, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(ros),
});

if (!resp.ok) {
  console.error(`Firebase PUT failed: ${resp.status} ${resp.statusText}`);
  process.exit(1);
}

console.log('Done.');
