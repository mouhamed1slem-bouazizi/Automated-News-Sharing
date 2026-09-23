/* Pure pipeline utilities shared by the extension, demo, and Node test suite. */
(function attachPipelineCore(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PipelineCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function buildPipelineCore() {
  function stripHtml(value = '') {
    return String(value)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  function canonicalizeUrl(value = '') {
    try {
      const url = new URL(value);
      url.hash = '';
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
        .forEach((key) => url.searchParams.delete(key));
      url.searchParams.sort();
      return url.toString().replace(/\/$/, '');
    } catch {
      return String(value).trim();
    }
  }

  function hash(value) {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16).padStart(8, '0');
  }

  function fingerprint(article) {
    const identity = article.guid || canonicalizeUrl(article.link) ||
      `${String(article.title || '').toLowerCase()}|${article.pubDate || ''}`;
    return `article_${hash(identity)}`;
  }

  function removeDuplicates(articles, processedIds = []) {
    const seen = new Set(processedIds);
    const unique = [];
    const duplicates = [];
    for (const article of articles) {
      const id = fingerprint(article);
      const normalized = { ...article, id, link: canonicalizeUrl(article.link) };
      if (seen.has(id)) duplicates.push(normalized);
      else {
        seen.add(id);
        unique.push(normalized);
      }
    }
    return { unique, duplicates };
  }

  function validateStructuredSummary(value) {
    const required = ['headline', 'summary', 'keyPoints', 'topics', 'riskFlags'];
    if (!value || typeof value !== 'object') throw new Error('LLM output must be a JSON object');
    for (const key of required) {
      if (!(key in value)) throw new Error(`LLM output is missing required field: ${key}`);
    }
    if (!Array.isArray(value.keyPoints) || !Array.isArray(value.topics) || !Array.isArray(value.riskFlags)) {
      throw new Error('keyPoints, topics, and riskFlags must be arrays');
    }
    return value;
  }

  function createDemoSummary(article) {
    const clean = stripHtml(article.content || article.description || '');
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
    const summary = sentences.slice(0, 2).join(' ').trim().slice(0, 320);
    const words = `${article.title} ${clean}`.toLowerCase().match(/[a-z][a-z-]{4,}/g) || [];
    const stop = new Set(['about', 'after', 'before', 'could', 'their', 'there', 'these', 'those', 'which', 'would']);
    const topics = [...new Set(words.filter((word) => !stop.has(word)))].slice(0, 3);
    return {
      headline: String(article.title || 'Untitled article').slice(0, 120),
      summary: summary || 'No summary was available for this article.',
      keyPoints: sentences.slice(0, 3).map((item) => item.trim()).filter(Boolean),
      topics,
      riskFlags: [],
    };
  }

  function formatPost(article, structured, options = {}) {
    const maxLength = options.maxLength || 280;
    const topicTags = structured.topics.slice(0, 2).map((topic) => `#${topic.replace(/[^a-z0-9]/gi, '')}`).filter((tag) => tag.length > 1);
    const suffix = [article.link, topicTags.join(' ')].filter(Boolean).join('\n');
    const allowance = Math.max(40, maxLength - suffix.length - 2);
    let body = `${structured.headline}\n\n${structured.summary}`;
    if (body.length > allowance) body = `${body.slice(0, allowance - 1).trim()}…`;
    return [body, suffix].filter(Boolean).join('\n\n');
  }

  return { stripHtml, canonicalizeUrl, fingerprint, removeDuplicates, validateStructuredSummary, createDemoSummary, formatPost };
});
