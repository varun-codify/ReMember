const axios = require('axios');

/**
 * Extract a YouTube video ID from common URL formats.
 * Returns the ID or null if the URL is not a recognized YouTube link.
 */
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Build a thumbnail URL for a video ID.
 * Quality can be 'maxresdefault' (large) or 'mqdefault' (small).
 */
function buildThumbnail(videoId, quality = 'maxresdefault') {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Fetch a video's title by scraping the YouTube watch page.
 * Returns the title, or null if it could not be extracted.
 */
async function fetchVideoTitle(videoId) {
  try {
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    let title = null;

    // Method 1: og:title meta tag
    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1];
    }

    // Method 2: <title> tag
    if (!title) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].replace(' - YouTube', '').trim();
      }
    }

    // Method 3: JSON title field
    if (!title) {
      const jsonMatch = html.match(/"title":"([^"]+)"/);
      if (jsonMatch && jsonMatch[1]) {
        title = jsonMatch[1];
      }
    }

    return title;
  } catch (error) {
    console.error('Error fetching YouTube page:', error.message);
    return null;
  }
}

module.exports = { extractYouTubeId, buildThumbnail, fetchVideoTitle };
