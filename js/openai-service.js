// OpenAI service for generating summaries

const OpenAIService = {
  // Generate summary using ChatGPT
  async generateSummary(title, content, summaryLength = 'medium') {
    try {
      // Get API key
      const apiKeys = await StorageService.getAPIKeys();
      const apiKey = apiKeys.openai;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      
      // Clean content (remove HTML tags)
      const cleanContent = this.cleanHtmlContent(content);
      
      // Determine token count based on summary length
      let maxTokens;
      let instructionPrefix;
      
      switch (summaryLength) {
        case 'short':
          maxTokens = 50;
          instructionPrefix = 'In 1-2 sentences';
          break;
        case 'long':
          maxTokens = 150;
          instructionPrefix = 'In 4-5 sentences';
          break;
        case 'medium':
        default:
          maxTokens = 100;
          instructionPrefix = 'In 2-3 sentences';
          break;
      }
      
      // Prepare prompt
      const prompt = `${instructionPrefix}, summarize the following article titled "${title}": ${cleanContent}`;
      
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes news articles concisely and accurately.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.5
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      return result.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  },
  
  // Clean HTML content
  cleanHtmlContent(html) {
    // Create a temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get text content
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Trim and limit length (to avoid token limits)
    text = text.trim();
    if (text.length > 4000) {
      text = text.substring(0, 4000) + '...';
    }
    
    return text;
  }
};