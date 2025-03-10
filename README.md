# RSS to X Poster Chrome Extension

A Chrome extension that automatically monitors RSS feeds, generates AI summaries of new articles using ChatGPT, and posts them to X (formerly Twitter).

## Features

- **RSS Feed Monitoring**: Connect to and monitor specified RSS feed URLs for new content
- **Automatic Content Detection**: Detect new articles in the feeds
- **AI Summary Generation**: Use ChatGPT to automatically generate concise summaries of articles
- **Social Media Integration**: Automatically post to X (Twitter) with the summary and article URL
- **User Configuration**:
  - Add/remove RSS feed URLs
  - Set posting frequency limits
  - Toggle automatic posting on/off
  - Customize summary length/style
  - Preview summaries before posting

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory

## Configuration

1. After installing the extension, click on the extension icon and then click "Settings"
2. Enter your OpenAI API key and Twitter API credentials
3. Configure your posting preferences and add RSS feeds
4. Toggle auto-posting on when you're ready to start

## Technical Details

- Built with Chrome Extension Manifest V3
- Uses the ChatGPT API for AI-powered summaries
- Integrates with the Twitter API for posting
- Securely stores API keys and user preferences

## Privacy & Security

- All API keys are stored locally in your browser's secure storage
- No data is sent to any servers other than the OpenAI and Twitter APIs
- The extension requests only the minimum permissions needed to function

## License

MIT