document.addEventListener('DOMContentLoaded', async () => {
  await load();
  document.getElementById('addFeedBtn').addEventListener('click', addFeed);
  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('resetBtn').addEventListener('click', reset);
});

async function load() {
  const settings = await StorageService.getSettings();
  const keys = await StorageService.getAPIKeys();
  document.getElementById('demoMode').checked = settings.demoMode !== false;
  document.getElementById('openaiModel').value = settings.openaiModel || 'gpt-5-mini';
  document.getElementById('maxPostLength').value = settings.maxPostLength || 280;
  document.getElementById('openaiKey').value = keys.openai || '';
  document.getElementById('twitterKey').value = keys.twitter || '';
  await renderFeeds();
}

async function renderFeeds() {
  const feeds = await StorageService.getFeeds();
  const list = document.getElementById('feedsList'); list.innerHTML = '';
  if (!feeds.length) { list.innerHTML = '<div class="empty">No RSS sources configured.</div>'; return; }
  feeds.forEach((feed) => {
    const row = document.createElement('div'); row.className = 'feed';
    const text = document.createElement('span'); text.textContent = feed.url;
    const remove = document.createElement('button'); remove.textContent = 'Remove';
    remove.addEventListener('click', async () => { await StorageService.removeFeed(feed.url); await renderFeeds(); });
    row.append(text, remove); list.appendChild(row);
  });
}

async function addFeed() {
  const input = document.getElementById('newFeedUrl');
  try { const url = new URL(input.value.trim()); await StorageService.addFeed({ url: url.toString(), addedAt: new Date().toISOString() }); input.value = ''; await renderFeeds(); show('RSS source added.'); }
  catch { show('Enter a valid http(s) feed URL.'); }
}

async function save() {
  const current = await StorageService.getSettings();
  await StorageService.saveSettings({ ...current, demoMode: document.getElementById('demoMode').checked, openaiModel: document.getElementById('openaiModel').value.trim() || 'gpt-5-mini', maxPostLength: Number(document.getElementById('maxPostLength').value) || 280 });
  await StorageService.saveAPIKeys({ openai: document.getElementById('openaiKey').value.trim(), twitter: document.getElementById('twitterKey').value.trim() });
  show('Settings saved. External publishing still requires approval.');
}

async function reset() {
  await StorageService.saveSettings({ monitoringEnabled: false, demoMode: true, openaiModel: 'gpt-5-mini', maxPostLength: 280 });
  await load(); show('Safe defaults restored.');
}

function show(text) { const message = document.getElementById('message'); message.textContent = text; message.style.display = 'block'; }
