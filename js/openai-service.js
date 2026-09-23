/* Optional OpenAI Responses API adapter with a no-credential demo fallback. */
const OpenAIService = {
  schema: {
    type: 'object', additionalProperties: false,
    properties: {
      headline: { type: 'string' },
      summary: { type: 'string' },
      keyPoints: { type: 'array', items: { type: 'string' } },
      topics: { type: 'array', items: { type: 'string' } },
      riskFlags: { type: 'array', items: { type: 'string' } },
    },
    required: ['headline', 'summary', 'keyPoints', 'topics', 'riskFlags'],
  },

  async generateStructuredSummary(article, options = {}) {
    const apiKeys = await StorageService.getAPIKeys();
    const apiKey = apiKeys.openai;
    if (!apiKey || options.demoMode) return PipelineCore.createDemoSummary(article);

    const model = options.model || 'gpt-5-mini';
    const content = PipelineCore.stripHtml(article.content || article.description).slice(0, 8000);
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        instructions: 'Summarize faithfully. Do not add facts. Flag uncertainty, sensitive claims, or missing context in riskFlags.',
        input: `Title: ${article.title}\nSource URL: ${article.link}\nArticle:\n${content}`,
        text: { format: { type: 'json_schema', name: 'news_summary', strict: true, schema: this.schema } },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI request failed with HTTP ${response.status}`);
    const result = await response.json();
    const text = result.output_text || result.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
    if (!text) throw new Error('OpenAI response did not contain output text');
    return PipelineCore.validateStructuredSummary(JSON.parse(text));
  },
};
