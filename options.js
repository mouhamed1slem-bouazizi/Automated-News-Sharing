// Options page script

document.addEventListener('DOMContentLoaded', async () => {
  // Get form elements
  const openaiKeyInput = document.getElementById('openaiKey');
  const twitterKeyInput = document.getElementById('twitterKey');
  const autoPostingEnabledCheckbox = document.getElementById('autoPostingEnabled');
  const previewBeforePostingCheckbox = document.getElementById('previewBeforePosting');
  const postingIntervalInput = document.getElementById('postingInterval');
  const summaryLengthSelect = document.getElementById('summaryLength');
  const includeHashtagsCheckbox = document.getElementById('includeHashtags');
  const hashtagsInput = document.getElementById('hashtags');
  const feedsList = document.getElementById('feedsList');
  const newFeedUrlInput = document.getElementById('newFeedUrl');
  const addFeedBtn = document.getElementById('addFeedBtn');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  
  // Load settings
  await loadSettings();
  
  // Load feeds
  await loadFeeds();
  
  // Event listeners
  addFeedBtn.addEventListener('click', addNewFeed);
  saveBtn.addEventListener('click', saveSettings);
  resetBtn.addEventListener('click', resetSettings);
  
  // Toggle hashtags input based on checkbox
  includeHashtagsCheckbox.addEventListener('change', () => {
    hashtagsInput.disabled = !includeHashtagsCheckbox.checked;
  });
  
  // Load settings from storage
  async function loadSettings() {
    try {
      // Get API keys
      const apiKeys = await StorageService.getAPIKeys();
      openaiKeyInput.value = apiKeys.openai || '';
      twitterKeyInput.value = apiKeys.twitter || '';
      
      // Get general settings
      const settings = await StorageService.getSettings();
      autoPostingEnabledCheckbox.checked = settings.autoPostingEnabled || false;
      previewBeforePostingCheckbox.checked = settings.previewBeforePosting || true;
      postingIntervalInput.value = settings.postingInterval || 60;
      summaryLengthSelect.value = settings.summaryLength || 'medium';
      includeHashtagsCheckbox.checked = settings.includeHashtags || false;
      hashtagsInput.value = settings.hashtags || '';
      hashtagsInput.disabled = !includeHashtagsCheckbox.checked;
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('Error loading settings. Please try again.', 'error');
    }
  }
  
  // Load feeds from storage
  async function loadFeeds() {
    try {
      const feeds = await StorageService.getFeeds();
      
      // Clear feeds list
      feedsList.innerHTML = '';
      
      if (feeds.length === 0) {
        feedsList.innerHTML = '<div class="empty-message">No feeds added yet</div>';
        return;
      }
      
      // Add each feed to the list
      feeds.forEach((feed, index) => {
        const feedItem = document.createElement('div');
        feedItem.className = 'feed-item';
        
        const feedUrl = document.createElement('div');
        feedUrl.className = 'feed-url';
        feedUrl.textContent = feed.url;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn small';
        removeBtn.textContent = 'Remove';
        removeBtn.dataset.index = index;
        removeBtn.addEventListener('click', removeFeed);
        
        feedItem.appendChild(feedUrl);
        feedItem.appendChild(removeBtn);
        
        feedsList.appendChild(feedItem);
      });
    } catch (error) {
      console.error('Error loading feeds:', error);
      showMessage('Error loading feeds. Please try again.', 'error');
    }
  }
  
  // Add new feed
  async function addNewFeed() {
    try {
      const url = newFeedUrlInput.value.trim();
      
      if (!url) {
        showMessage('Please enter a feed URL', 'error');
        return;
      }
      
      // Validate URL
      try {
        new URL(url);
      } catch (e) {
        showMessage('Please enter a valid URL', 'error');
        return;
      }
      
      // Add feed to storage
      await StorageService.addFeed({
        url,
        name: url.split('/').pop() || 'New Feed',
        added: Date.now()
      });
      
      // Clear input
      newFeedUrlInput.value = '';
      
      // Reload feeds
      await loadFeeds();
      
      showMessage('Feed added successfully', 'success');
    } catch (error) {
      console.error('Error adding feed:', error);
      showMessage('Error adding feed. Please try again.', 'error');
    }
  }
  
  // Remove feed
  async function removeFeed(event) {
    try {
      const index = parseInt(event.target.dataset.index);
      const feeds = await StorageService.getFeeds();
      
      if (index >= 0 && index < feeds.length) {
        if (confirm(`Are you sure you want to remove the feed: ${feeds[index].url}?`)) {
          await StorageService.removeFeed(feeds[index].url);
          await loadFeeds();
          showMessage('Feed removed successfully', 'success');
        }
      }
    } catch (error) {
      console.error('Error removing feed:', error);
      showMessage('Error removing feed. Please try again.', 'error');
    }
  }
  
  // Save settings
  async function saveSettings() {
    try {
      // Save API keys
      await StorageService.saveAPIKeys({
        openai: openaiKeyInput.value.trim(),
        twitter: twitterKeyInput.value.trim()
      });
      
      // Save general settings
      await StorageService.saveSettings({
        autoPostingEnabled: autoPostingEnabledCheckbox.checked,
        previewBeforePosting: previewBeforePostingCheckbox.checked,
        postingInterval: parseInt(postingIntervalInput.value) || 60,
        summaryLength: summaryLengthSelect.value,
        includeHashtags: includeHashtagsCheckbox.checked,
        hashtags: hashtagsInput.value.trim()
      });
      
      showMessage('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('Error saving settings. Please try again.', 'error');
    }
  }
  
  // Reset settings
  async function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      try {
        await StorageService.initializeDefaultSettings();
        await loadSettings();
        showMessage('Settings reset to default', 'success');
      } catch (error) {
        console.error('Error resetting settings:', error);
        showMessage('Error resetting settings. Please try again.', 'error');
      }
    }
  }
  
  // Show message
  function showMessage(message, type = 'info') {
    // Create message element if it doesn't exist
    let messageElement = document.querySelector('.message');
    
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.className = 'message';
      document.querySelector('.container').prepend(messageElement);
    }
    
    // Set message content and type
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    
    // Show message
    messageElement.style.display = 'block';
    
    // Hide message after 3 seconds
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 3000);
  }
});