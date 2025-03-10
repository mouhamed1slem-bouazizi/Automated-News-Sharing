// Background script - runs in the background

// Import services
importScripts('js/storage-service.js', 'js/rss-parser.js', 'js/openai-service.js', 'js/twitter-service.js');

// Set up alarm for periodic checking
chrome.alarms.create('checkFeeds', { periodInMinutes: 15 });

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkFeeds') {
    checkRSSFeeds();
  }
});

// Check for new content in RSS feeds
async function checkRSSFeeds() {
  try {
    // Get user settings
    const settings = await StorageService.getSettings();
    
    if (!settings.autoPostingEnabled) {
      console.log('Auto-posting is disabled');
      return;
    }
    
    // Get the list of feeds
    const feeds = await StorageService.getFeeds();
    
    // Get already processed articles
    const processedArticles = await StorageService.getProcessedArticles();
    
    for (const feed of feeds) {
      // Fetch and parse the RSS feed
      const articles = await RSSParser.fetchFeed(feed.url);
      
      // Check for new articles
      for (const article of articles) {
        // Skip if already processed
        if (processedArticles.includes(article.guid)) {
          continue;
        }
        
        // Process new article
        await processNewArticle(article, settings);
        
        // Add to processed list
        await StorageService.addProcessedArticle(article.guid);
        
        // Check posting frequency limits
        const lastPostTime = await StorageService.getLastPostTime();
        if (Date.now() - lastPostTime < settings.postingInterval * 60 * 1000) {
          console.log('Posting frequency limit reached, will process remaining articles later');
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error checking RSS feeds:', error);
  }
}

// Process a new article
async function processNewArticle(article, settings) {
  try {
    // Generate summary using ChatGPT
    const summary = await OpenAIService.generateSummary(
      article.title,
      article.content,
      settings.summaryLength
    );
    
    // Prepare post content
    let postContent = `${summary}\n\n${article.link}`;
    
    // Add hashtags if enabled
    if (settings.includeHashtags && settings.hashtags) {
      const hashtags = settings.hashtags.split(',')
        .slice(0, 2)
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        .join(' ');
      
      if (hashtags) {
        postContent += `\n\n${hashtags}`;
      }
    }
    
    // If preview is required, store for later
    if (settings.previewBeforePosting) {
      await StorageService.addPendingPost({
        content: postContent,
        article: article,
        summary: summary,
        timestamp: Date.now()
      });
      
      // Notify user about pending post
      chrome.action.setBadgeText({ text: '!' });
    } else {
      // Post directly to Twitter
      await TwitterService.postToTwitter(postContent);
      await StorageService.setLastPostTime(Date.now());
    }
  } catch (error) {
    console.error('Error processing article:', error);
  }
}

// Initial setup
chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  StorageService.initializeDefaultSettings();
  
  // Check feeds immediately after installation
  checkRSSFeeds();
});


// Add this to the background.js file

// Listen for messages from popup or options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkFeeds') {
    // Manually trigger feed check
    checkRSSFeeds()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }
});