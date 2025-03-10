// RSS Parser service

const RSSParser = {
  // Fetch and parse RSS feed
  async fetchFeed(feedUrl) {
    try {
      const response = await fetch(feedUrl);
      const text = await response.text();
      
      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      // Check if it's RSS or Atom
      const isRSS = xmlDoc.querySelector('rss, channel');
      const isAtom = xmlDoc.querySelector('feed');
      
      if (isRSS) {
        return this.parseRSS(xmlDoc);
      } else if (isAtom) {
        return this.parseAtom(xmlDoc);
      } else {
        throw new Error('Unsupported feed format');
      }
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      return [];
    }
  },
  
  // Parse RSS format
  parseRSS(xmlDoc) {
    const items = xmlDoc.querySelectorAll('item');
    const articles = [];
    
    items.forEach(item => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const content = item.querySelector('content\\:encoded, content')?.textContent || description;
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const guid = item.querySelector('guid')?.textContent || link;
      
      articles.push({
        title,
        link,
        content,
        pubDate: new Date(pubDate),
        guid
      });
    });
    
    // Sort by publication date (newest first)
    return articles.sort((a, b) => b.pubDate - a.pubDate);
  },
  
  // Parse Atom format
  parseAtom(xmlDoc) {
    const entries = xmlDoc.querySelectorAll('entry');
    const articles = [];
    
    entries.forEach(entry => {
      const title = entry.querySelector('title')?.textContent || '';
      const link = entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || 
                  entry.querySelector('link')?.getAttribute('href') || '';
      const content = entry.querySelector('content')?.textContent || 
                     entry.querySelector('summary')?.textContent || '';
      const pubDate = entry.querySelector('published, updated')?.textContent || '';
      const guid = entry.querySelector('id')?.textContent || link;
      
      articles.push({
        title,
        link,
        content,
        pubDate: new Date(pubDate),
        guid
      });
    });
    
    // Sort by publication date (newest first)
    return articles.sort((a, b) => b.pubDate - a.pubDate);
  }
};