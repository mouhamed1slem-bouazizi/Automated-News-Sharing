const test = require('node:test');
const assert = require('node:assert/strict');
const { FeedParseError, validateFeedText } = require('../js/rss-parser.js');

test('accepts the outer structure of a valid RSS feed', () => {
  assert.equal(validateFeedText('<?xml version="1.0"?><rss><channel></channel></rss>'), 'rss');
});

test('accepts the outer structure of a valid Atom feed', () => {
  assert.equal(validateFeedText('<feed xmlns="http://www.w3.org/2005/Atom"></feed>'), 'atom');
});

test('rejects an empty feed response', () => {
  assert.throws(() => validateFeedText(''), FeedParseError);
});

test('rejects HTML returned instead of a feed', () => {
  assert.throws(() => validateFeedText('<html><body>Rate limited</body></html>'), /not an RSS or Atom/);
});

test('rejects truncated RSS XML', () => {
  assert.throws(() => validateFeedText('<rss><channel><item></item>'), /missing closing element/);
});

test('rejects truncated Atom XML', () => {
  assert.throws(() => validateFeedText('<feed><entry></entry>'), /missing closing element/);
});
