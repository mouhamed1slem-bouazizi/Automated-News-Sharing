// Popup script

document.addEventListener('DOMContentLoaded', async () => {
  // Get elements
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const autoPostingToggle = document.getElementById('autoPostingToggle');
  const pendingPostsList = document.getElementById('pendingPostsList');
  const pendingCount = document.getElementById('pendingCount');
  const recentPostsList = document.getElementById('recentPostsList');
  const recentCount = document.getElementById('recentCount');
  const addFeedBtn = document.getElementById('addFeedBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  
  // Load settings
  const settings = await StorageService.getSettings();
  autoPostingToggle.checked = settings.autoPostingEnabled;
  
  // Update status
  updateStatus(settings.autoPostingEnabled);
  
  // Load pending posts
  const pendingPosts = await StorageService.getPendingPosts();
  updatePendingPosts(pendingPosts);
  
  // Load recent posts (this would be implemented in a real extension)
  // For now, we'll just show a placeholder
  updateRecentPosts([]);
  
  // Event listeners
  autoPostingToggle.addEventListener('change', async () => {
    const settings = await StorageService.getSettings();
    settings.autoPostingEnabled = autoPostingToggle.checked;
    await StorageService.saveSettings(settings);
    updateStatus(settings.autoPostingEnabled);
  });
  
  addFeedBtn.addEventListener('click', () => {
    const feedUrl = prompt('Enter RSS feed URL:');
    if (feedUrl) {
      addNewFeed(feedUrl);
    }
  });
  
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Clear badge when popup is opened
  chrome.action.setBadgeText({ text: '' });
});

// Update status indicator
function updateStatus(isEnabled) {
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  
  if (isEnabled) {
    statusIcon.className = 'status-icon active';
    statusText.textContent = 'Auto-posting is active';
  } else {
    statusIcon.className = 'status-icon inactive';
    statusText.textContent = 'Auto-posting is paused';
  }
}

// Update pending posts list
function updatePendingPosts(posts) {
  const pendingPostsList = document.getElementById('pendingPostsList');
  const pendingCount = document.getElementById('pendingCount');
  
  pendingCount.textContent = posts.length;
  pendingPostsList.innerHTML = '';
  
  if (posts.length === 0) {
    pendingPostsList.innerHTML = '<div class="empty-message">No pending posts</div>';
    return;
  }
  
  posts.forEach((post, index) => {
    const postElement = document.createElement('div');
    postElement.className = 'post-item';
    
    const title = document.createElement('div');
    title.className = 'post-title';
    title.textContent = post.article.title;
    
    const summary = document.createElement('div');
    summary.className = 'post-summary';
    summary.textContent = post.summary;
    
    const actions = document.createElement('div');
    actions.className = 'post-actions';
    
    const postBtn = document.createElement('button');
    postBtn.className = 'btn small primary';
    postBtn.textContent = 'Post Now';
    postBtn.addEventListener('click', () => postPendingItem(index));
    
    const discardBtn = document.createElement('button');
    discardBtn.className = 'btn small';
    discardBtn.textContent = 'Discard';
    discardBtn.addEventListener('click', () => discardPendingItem(index));
    
    actions.appendChild(postBtn);
    actions.appendChild(discardBtn);
    
    postElement.appendChild(title);
    postElement.appendChild(summary);
    postElement.appendChild(actions);
    
    pendingPostsList.appendChild(postElement);
  });
}

// Update recent posts list
function updateRecentPosts(posts) {
  const recentPostsList = document.getElementById('recentPostsList');
  const recentCount = document.getElementById('recentCount');
  
  recentCount.textContent = posts.length;
  recentPostsList.innerHTML = '';
  
  if (posts.length === 0) {
    recentPostsList.innerHTML = '<div class="empty-message">No recent posts</div>';
    return;
  }
  
  // In a real implementation, you would show recent posts here
}

// Add new RSS feed
async function addNewFeed(url) {
  try {
    // Validate URL
    new URL(url);
    
    // Add feed
    await StorageService.addFeed({
      url,
      name: url.split('/').pop() || 'New Feed',
      added: Date.now()
    });
    
    // Trigger feed check
    chrome.runtime.sendMessage({ action: 'checkFeeds' });
    
    alert('Feed added successfully!');
  } catch (error) {
    alert('Invalid URL. Please enter a valid RSS feed URL.');
  }
}

// Post pending item
async function postPendingItem(index) {
  try {
    const pendingPosts = await StorageService.getPendingPosts();
    const post = pendingPosts[index];
    
    if (!post) {
      return;
    }
    
    // Post to Twitter
    await TwitterService.postToTwitter(post.content);
    
    // Remove from pending
    await StorageService.removePendingPost(index);
    
    // Update last post time
    await StorageService.setLastPostTime(Date.now());
    
    // Refresh list
    const updatedPosts = await StorageService.getPendingPosts();
    updatePendingPosts(updatedPosts);
    
    alert('Posted successfully!');
  } catch (error) {
    alert(`Error posting: ${error.message}`);
  }
}

// Discard pending item
async function discardPendingItem(index) {
  if (confirm('Are you sure you want to discard this post?')) {
    await StorageService.removePendingPost(index);
    
    // Refresh list
    const updatedPosts = await StorageService.getPendingPosts();
    updatePendingPosts(updatedPosts);
  }
}