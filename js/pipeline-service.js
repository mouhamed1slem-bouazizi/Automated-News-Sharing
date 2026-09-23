/* Orchestrates ingestion, de-duplication, LLM enrichment, formatting, and review queueing. */
const PipelineService = {
  async processArticles(articles, settings) {
    const processedIds = await StorageService.getProcessedArticles();
    const { unique, duplicates } = PipelineCore.removeDuplicates(articles, processedIds);
    const queued = [];

    for (const article of unique) {
      const structured = await OpenAIService.generateStructuredSummary(article, {
        demoMode: settings.demoMode,
        model: settings.openaiModel,
      });
      const content = PipelineCore.formatPost(article, structured, { maxLength: settings.maxPostLength || 280 });
      const pending = {
        id: article.id,
        article,
        structured,
        content,
        status: 'awaiting_user_approval',
        createdAt: new Date().toISOString(),
      };
      await StorageService.addPendingPost(pending);
      await StorageService.addProcessedArticle(article.id);
      queued.push(pending);
    }
    return { received: articles.length, queued, duplicates };
  },
};
