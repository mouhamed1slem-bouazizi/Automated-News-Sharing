const fs = require('node:fs');
const path = require('node:path');
const { createDemoSummary, fingerprint, formatPost, removeDuplicates } = require('../js/pipeline-core.js');

const article = {
  guid: 'city-tech-2026-042',
  title: 'City launches electric bus network',
  link: 'https://example.com/news/electric-buses?utm_source=rss',
  content: 'The city launched 40 electric buses today. Officials expect the fleet to reduce transport emissions and operating costs.',
  pubDate: '2026-09-23T08:00:00Z',
};
const result = removeDuplicates([article]);
const structured = createDemoSummary(result.unique[0]);
const formatted = formatPost(result.unique[0], structured);

console.log('RSS → LLM CONTENT PIPELINE (OFFLINE DEMO)');
console.log(`✓ Ingested: 1 article`);
console.log(`✓ Fingerprint: ${fingerprint(article)}`);
console.log(`✓ Duplicates skipped: ${result.duplicates.length}`);
console.log('✓ Structured summary validated');
console.log('✓ Formatted output queued for human approval');
console.log('\n' + JSON.stringify(structured, null, 2));
console.log('\n--- PUBLISHING PREVIEW ---\n' + formatted);
console.log('\n🔒 External publishing disabled: user approval + credentials required.');
