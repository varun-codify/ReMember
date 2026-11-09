const axios = require('axios');
const aiService = require('./aiService');

/**
 * Universal capture support: detect what kind of link a user is saving and
 * enrich it with content (for full-text search) and metadata. Every function
 * here is best-effort — a failure never blocks saving the item.
 */

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MAX_CONTENT_CHARS = 30000;
const WEBSITE_CATEGORIES = ['ai', 'productivity', 'learning', 'utilities', 'development', 'design', 'other'];

// pdf-parse v1: default export is a function — pdfParse(buffer) → { text }
// pdf-parse v2: named `PDFParse` class — new PDFParse({ data }) → parser.getText()
const parsePdfBuffer = async (buffer) => {
  const mod = require('pdf-parse');
  const PdfParse = typeof mod === 'function' ? mod : mod.PDFParse;
  if (PdfParse.prototype && typeof PdfParse.prototype.getText === 'function') {
    const parser = new PdfParse({ data: buffer });
    const result = await parser.getText();
    return (result && result.text) || '';
  }
  const data = await PdfParse(buffer);
  return (data && data.text) || '';
};

/** Classify a URL: youtube (handled by the video module), github repo, pdf, image, or webpage. */
function detectMediaType(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const isGithub = u.hostname === 'github.com' || u.hostname === 'www.github.com';
    if (isGithub && u.pathname.split('/').filter(Boolean).length >= 2) {
      return 'github';
    }
    const path = u.pathname.toLowerCase();
    if (path.endsWith('.pdf')) return 'pdf';
    if (/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/.test(path)) return 'image';
    return 'webpage';
  } catch (e) {
    return 'webpage';
  }
}

const stripHtml = (html) =>
  String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Fetch a webpage and extract readable text (best-effort). */
async function fetchWebpageText(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/xhtml+xml,*/*' },
    timeout: 9000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400
  });
  return stripHtml(res.data || '').slice(0, MAX_CONTENT_CHARS);
}

/** Download + parse a PDF into text (best-effort). */
async function fetchPdfText(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000,
    maxRedirects: 5
  });
  const size = Number(res.headers['content-length'] || 0);
  if (size > 25 * 1024 * 1024) return '';
  const text = await parsePdfBuffer(Buffer.from(res.data));
  return String(text)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CONTENT_CHARS);
}

/** Fetch public GitHub repo metadata (no auth — unauthenticated rate limits apply). */
async function fetchGithubMeta(url) {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  if (parts.length < 2) return {};
  const [owner, repo] = parts;
  const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'remember-app' },
    timeout: 8000
  });
  const d = res.data || {};
  return {
    githubStars: d.stargazers_count || 0,
    githubLanguage: d.language || '',
    githubDescription: d.description || ''
  };
}

/** Fetch a YouTube transcript as plain text (best-effort; returns '' on failure). */
async function fetchYoutubeTranscript(videoId) {
  try {
    const { YoutubeTranscript } = require('youtube-transcript');
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    if (!Array.isArray(segments)) return '';
    return segments
      .map((s) => s.text || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_CONTENT_CHARS);
  } catch (e) {
    return '';
  }
}

/**
 * Enrich a website on save: detect media type, extract content/metadata, and
 * (when AI is enabled) generate a summary + key points + a category suggestion.
 * Always resolves — never throws.
 */
async function enrichWebsite({ name, url, description, category }) {
  const mediaType = detectMediaType(url);
  let content = '';
  let extra = {};
  try {
    if (mediaType === 'pdf') content = await fetchPdfText(url);
    else if (mediaType === 'github') extra = await fetchGithubMeta(url);
    else if (mediaType === 'webpage') content = await fetchWebpageText(url);
    // images carry no extractable text
  } catch (e) {
    /* best effort */
  }

  let summary = '';
  let keyPoints = [];
  let suggestedCategory = null;
  if (aiService.isEnabled() && (content || description)) {
    try {
      const ai = await aiService.summarizeContent({
        title: name,
        content: content || description || ''
      });
      if (ai) {
        summary = ai.summary || '';
        keyPoints = ai.keyPoints || [];
        suggestedCategory = ai.suggestedCategory;
      }
    } catch (e) {
      /* best effort */
    }
  }

  // Whitelist the AI suggestion — an out-of-enum value would break the category
  // colors and collection rules (updateOne does not run schema validators).
  const finalCategory =
    category && category !== 'other'
      ? category
      : WEBSITE_CATEGORIES.includes(suggestedCategory)
        ? suggestedCategory
        : category || 'other';

  return {
    mediaType,
    content,
    summary,
    keyPoints,
    category: finalCategory,
    ...extra
  };
}

/**
 * Enrich a video on save: store the transcript and (when AI is enabled)
 * generate a summary + key points from it. Always resolves — never throws.
 */
async function enrichVideo({ title, personalNotes, transcript }) {
  let summary = '';
  let keyPoints = [];
  if (aiService.isEnabled() && (transcript || personalNotes)) {
    try {
      const ai = await aiService.summarizeContent({
        title,
        content: transcript || personalNotes || ''
      });
      if (ai) {
        summary = ai.summary || '';
        keyPoints = ai.keyPoints || [];
      }
    } catch (e) {
      /* best effort */
    }
  }
  return { transcript: transcript || '', summary, keyPoints };
}

module.exports = {
  detectMediaType,
  enrichWebsite,
  enrichVideo,
  fetchYoutubeTranscript,
  fetchWebpageText,
  fetchPdfText,
  fetchGithubMeta
};
