const test = require('node:test');
const assert = require('node:assert/strict');
const { createDemoSummary, formatPost, validateStructuredSummary } = require('../js/pipeline-core.js');

const article = {
  title: 'City launches electric bus network',
  link: 'https://example.com/news/electric-buses',
  content: '<p>The city launched 40 electric buses today. Officials expect lower emissions.</p>',
};

test('offline summarizer returns the documented structure', () => {
  const result = createDemoSummary(article);
  assert.deepEqual(Object.keys(result), ['headline', 'summary', 'keyPoints', 'topics', 'riskFlags']);
  assert.equal(validateStructuredSummary(result), result);
});

test('formatted post respects the configured maximum length', () => {
  const output = formatPost(article, createDemoSummary(article), { maxLength: 220 });
  assert.ok(output.length <= 220);
  assert.match(output, /https:\/\/example.com\/news\/electric-buses/);
});
