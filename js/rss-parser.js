/* RSS/Atom parsing with explicit malformed-feed errors. */
(function attachRSSParser(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RSSParser = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function buildRSSParser() {
  class FeedParseError extends Error {
    constructor(message) {
      super(message);
      this.name = 'FeedParseError';
    }
  }

  function validateFeedText(text) {
    const value = String(text || '').trim();
    if (!value) throw new FeedParseError('Feed response was empty');
    if (!/^<\?xml\b|^<(rss|feed)\b/i.test(value)) {
      throw new FeedParseError('Response is not an RSS or Atom XML document');
    }
    const isRSS = /<rss\b/i.test(value) && /<channel\b/i.test(value);
    const isAtom = /<feed\b/i.test(value);
    if (!isRSS && !isAtom) throw new FeedParseError('Unsupported feed format');
    if (isRSS && (!/<\/channel>/i.test(value) || !/<\/rss>/i.test(value))) {
      throw new FeedParseError('Malformed RSS feed: missing closing element');
    }
    if (isAtom && !/<\/feed>/i.test(value)) {
      throw new FeedParseError('Malformed Atom feed: missing closing element');
    }
    return isRSS ? 'rss' : 'atom';
  }

  function parseDocument(text, DOMParserClass = globalThis.DOMParser) {
    const format = validateFeedText(text);
    if (!DOMParserClass) throw new FeedParseError('DOMParser is unavailable in this runtime');
    const document = new DOMParserClass().parseFromString(text, 'application/xml');
    const parserError = document.querySelector('parsererror');
    if (parserError) throw new FeedParseError(`Malformed XML: ${parserError.textContent.trim()}`);
    return { document, format };
  }

  function safeDate(value) {
    const date = new Date(value || 0);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  }

  function parseFeed(text, DOMParserClass) {
    const { document, format } = parseDocument(text, DOMParserClass);
    const nodes = document.querySelectorAll(format === 'rss' ? 'item' : 'entry');
    const articles = [...nodes].map((node) => {
      const title = node.querySelector('title')?.textContent?.trim() || '';
      const link = format === 'rss'
        ? node.querySelector('link')?.textContent?.trim() || ''
        : node.querySelector('link[rel="alternate"]')?.getAttribute('href') || node.querySelector('link')?.getAttribute('href') || '';
      const description = node.querySelector('description, summary')?.textContent?.trim() || '';
      const content = node.querySelector('content\\:encoded, content')?.textContent?.trim() || description;
      const pubDate = node.querySelector('pubDate, published, updated')?.textContent?.trim() || '';
      const guid = node.querySelector('guid, id')?.textContent?.trim() || link;
      return { title, link, description, content, pubDate, guid };
    });
    return articles.sort((a, b) => safeDate(b.pubDate) - safeDate(a.pubDate));
  }

  async function fetchFeed(feedUrl, fetchImpl = fetch) {
    const response = await fetchImpl(feedUrl, { headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' } });
    if (!response.ok) throw new FeedParseError(`Feed request failed with HTTP ${response.status}`);
    return parseFeed(await response.text());
  }

  return { FeedParseError, validateFeedText, parseFeed, fetchFeed };
});
