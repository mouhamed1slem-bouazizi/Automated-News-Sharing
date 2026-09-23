importScripts(
  'js/storage-service.js',
  'js/pipeline-core.js',
  'js/rss-parser.js',
  'js/openai-service.js',
  'js/publishing-service.js',
  'js/pipeline-service.js',
);

chrome.alarms.create('checkFeeds', { periodInMinutes: 30 });

async function checkRSSFeeds() {
  const settings = await StorageService.getSettings();
  if (!settings.monitoringEnabled) return { skipped: true, reason: 'monitoring_disabled' };

  const feeds = await StorageService.getFeeds();
  const report = { feeds: feeds.length, received: 0, queued: 0, duplicates: 0, errors: [] };
  for (const feed of feeds) {
    try {
      const articles = await RSSParser.fetchFeed(feed.url);
      const result = await PipelineService.processArticles(articles, settings);
      report.received += result.received;
      report.queued += result.queued.length;
      report.duplicates += result.duplicates.length;
    } catch (error) {
      report.errors.push({ feed: feed.url, message: error.message });
    }
  }
  const pending = await StorageService.getPendingPosts();
  chrome.action.setBadgeText({ text: pending.length ? String(Math.min(pending.length, 99)) : '' });
  await StorageService.setLastRun(report);
  return report;
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkFeeds') checkRSSFeeds().catch(console.error);
});

chrome.runtime.onInstalled.addListener(async () => {
  await StorageService.initializeDefaultSettings();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'checkFeeds') {
    checkRSSFeeds().then((report) => sendResponse({ success: true, report }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
  return false;
});
