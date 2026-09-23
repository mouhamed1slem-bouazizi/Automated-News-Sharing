// Storage service for managing extension data

const StorageService = {
  // Initialize default settings
  async initializeDefaultSettings() {
    const settings = await this.getSettings();
    
    if (!settings || Object.keys(settings).length === 0) {
      await chrome.storage.sync.set({
        settings: {
          monitoringEnabled: false,
          demoMode: true,
          openaiModel: 'gpt-5-mini',
          maxPostLength: 280
        }
      });
    }
    
    // Initialize empty feeds list if not exists
    const feeds = await this.getFeeds();
    if (!feeds) {
      await chrome.storage.sync.set({ feeds: [] });
    }
    
    // Initialize empty processed articles list if not exists
    const processedArticles = await this.getProcessedArticles();
    if (!processedArticles) {
      await chrome.storage.local.set({ processedArticles: [] });
    }
    
    // Initialize empty pending posts list if not exists
    const pendingPosts = await this.getPendingPosts();
    if (!pendingPosts) {
      await chrome.storage.local.set({ pendingPosts: [] });
    }
  },
  
  // Get user settings
  async getSettings() {
    const data = await chrome.storage.sync.get('settings');
    return data.settings || {};
  },
  
  // Save user settings
  async saveSettings(settings) {
    await chrome.storage.sync.set({ settings });
  },
  
  // Get API keys
  async getAPIKeys() {
    const data = await chrome.storage.local.get('apiKeys');
    return data.apiKeys || { openai: '', twitter: '' };
  },
  
  // Save API keys
  async saveAPIKeys(apiKeys) {
    await chrome.storage.local.set({ apiKeys });
  },
  
  // Get RSS feeds
  async getFeeds() {
    const data = await chrome.storage.sync.get('feeds');
    return data.feeds || [];
  },
  
  // Add RSS feed
  async addFeed(feed) {
    const feeds = await this.getFeeds();
    feeds.push(feed);
    await chrome.storage.sync.set({ feeds });
  },
  
  // Remove RSS feed
  async removeFeed(feedUrl) {
    let feeds = await this.getFeeds();
    feeds = feeds.filter(feed => feed.url !== feedUrl);
    await chrome.storage.sync.set({ feeds });
  },
  
  // Get processed articles
  async getProcessedArticles() {
    const data = await chrome.storage.local.get('processedArticles');
    return data.processedArticles || [];
  },
  
  // Add processed article
  async addProcessedArticle(articleId) {
    const processedArticles = await this.getProcessedArticles();
    
    // Add to the beginning and keep only the last 1000 articles
    processedArticles.unshift(articleId);
    if (processedArticles.length > 1000) {
      processedArticles.pop();
    }
    
    await chrome.storage.local.set({ processedArticles });
  },
  
  // Get pending posts
  async getPendingPosts() {
    const data = await chrome.storage.local.get('pendingPosts');
    return data.pendingPosts || [];
  },
  
  // Add pending post
  async addPendingPost(post) {
    const pendingPosts = await this.getPendingPosts();
    pendingPosts.push(post);
    await chrome.storage.local.set({ pendingPosts });
  },
  
  // Remove pending post
  async removePendingPost(postIndex) {
    const pendingPosts = await this.getPendingPosts();
    pendingPosts.splice(postIndex, 1);
    await chrome.storage.local.set({ pendingPosts });
  },
  
  // Get last post time
  async getLastPostTime() {
    const data = await chrome.storage.local.get('lastPostTime');
    return data.lastPostTime || 0;
  },
  
  // Set last post time
  async setLastPostTime(timestamp) {
    await chrome.storage.local.set({ lastPostTime: timestamp });
  },

  async getLastRun() {
    const data = await chrome.storage.local.get('lastRun');
    return data.lastRun || null;
  },

  async setLastRun(report) {
    await chrome.storage.local.set({ lastRun: { ...report, completedAt: new Date().toISOString() } });
  }
};
