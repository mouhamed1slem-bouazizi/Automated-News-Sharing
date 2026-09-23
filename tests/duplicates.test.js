const test = require('node:test');
const assert = require('node:assert/strict');
const { canonicalizeUrl, fingerprint, removeDuplicates } = require('../js/pipeline-core.js');

test('canonical URL removes tracking parameters and fragments', () => {
  assert.equal(
    canonicalizeUrl('https://example.com/story?utm_source=rss&id=42#comments'),
    'https://example.com/story?id=42',
  );
});

test('duplicate GUIDs are processed once', () => {
  const articles = [
    { guid: 'story-42', title: 'First copy', link: 'https://example.com/story' },
    { guid: 'story-42', title: 'Second copy', link: 'https://mirror.example/story' },
  ];
  const result = removeDuplicates(articles);
  assert.equal(result.unique.length, 1);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.unique[0].id, result.duplicates[0].id);
});

test('tracking variants of the same URL are detected as duplicates', () => {
  const original = { title: 'Story', link: 'https://example.com/story?id=42' };
  const tracked = { title: 'Story', link: 'https://example.com/story?utm_medium=social&id=42#top' };
  const result = removeDuplicates([original, tracked]);
  assert.equal(result.unique.length, 1);
  assert.equal(result.duplicates.length, 1);
});

test('previously processed fingerprints are skipped', () => {
  const article = { guid: 'already-seen', title: 'Old story', link: 'https://example.com/old' };
  const result = removeDuplicates([article], [fingerprint(article)]);
  assert.equal(result.unique.length, 0);
  assert.equal(result.duplicates.length, 1);
});
