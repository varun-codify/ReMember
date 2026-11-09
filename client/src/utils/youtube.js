// Extract a YouTube video ID from common URL formats.
// Returns the ID or null if the URL is not a recognized YouTube link.
export function extractYouTubeId(url = '') {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export function isYouTubeUrl(url = '') {
  return !!extractYouTubeId(url);
}
