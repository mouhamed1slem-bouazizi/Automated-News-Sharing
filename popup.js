document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('monitoringToggle');
  const settings = await StorageService.getSettings();
  toggle.checked = Boolean(settings.monitoringEnabled);
  updateStatus(toggle.checked);
  await renderQueue();

  toggle.addEventListener('change', async () => {
    const current = await StorageService.getSettings();
    current.monitoringEnabled = toggle.checked;
    await StorageService.saveSettings(current);
    updateStatus(toggle.checked);
  });
  document.getElementById('runBtn').addEventListener('click', () => {
    const status = document.getElementById('runStatus');
    status.textContent = 'Processing feeds…';
    chrome.runtime.sendMessage({ action: 'checkFeeds' }, async (response) => {
      status.textContent = response?.success
        ? `${response.report.queued} queued · ${response.report.duplicates} duplicates skipped`
        : `Run failed: ${response?.error || 'unknown error'}`;
      await renderQueue();
    });
  });
  document.getElementById('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
});

function updateStatus(active) {
  document.getElementById('statusText').textContent = active ? 'Feed monitoring active' : 'Monitoring paused';
  document.querySelector('.dot').style.background = active ? '#57dbc4' : '#f0b35b';
}

async function renderQueue() {
  const posts = await StorageService.getPendingPosts();
  document.getElementById('pendingCount').textContent = posts.length;
  const list = document.getElementById('pendingPostsList');
  list.innerHTML = '';
  if (!posts.length) {
    list.innerHTML = '<div class="empty">No pending items. Add a feed in Settings, then run the pipeline.</div>';
    return;
  }
  posts.forEach((post, index) => {
    const item = document.createElement('article');
    item.className = 'item';
    const title = document.createElement('h3'); title.textContent = post.structured.headline;
    const summary = document.createElement('p'); summary.textContent = post.structured.summary;
    const signals = document.createElement('div'); signals.className = 'signals';
    post.structured.topics.forEach((topic) => { const tag = document.createElement('span'); tag.textContent = topic; signals.appendChild(tag); });
    const actions = document.createElement('div'); actions.className = 'actions';
    const discard = document.createElement('button'); discard.textContent = 'Discard';
    discard.addEventListener('click', async () => { await StorageService.removePendingPost(index); await renderQueue(); });
    const approve = document.createElement('button'); approve.className = 'approve'; approve.textContent = 'Approve for publishing';
    approve.addEventListener('click', async () => {
      if (!confirm('Approve this exact content for the configured external publisher?')) return;
      try { await PublishingService.publishApprovedPost(post, { userApproved: true }); alert('Approved. Production adapter is intentionally disabled in this portfolio build.'); }
      catch (error) { alert(error.message); }
    });
    actions.append(discard, approve); item.append(title, summary, signals, actions); list.appendChild(item);
  });
}
