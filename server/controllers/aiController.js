const aiService = require('../services/aiService');
const Video = require('../models/Video');
const Website = require('../models/Website');
const Note = require('../models/Note');

// @route   GET /api/ai/status
// @desc    Whether AI features are configured (so the client can hide/show them)
// @access  Private
exports.getStatus = (req, res) => {
  res.json({
    success: true,
    data: { enabled: aiService.isEnabled() }
  });
};

// @route   POST /api/ai/parse
// @desc    Parse a natural-language note into structured capture data
// @access  Private
exports.parse = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }
    if (!aiService.isEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'AI is not configured. Set AI_API_KEY in the server environment.'
      });
    }

    const data = await aiService.parseCapture(String(text).trim());
    if (!data) {
      return res.status(502).json({
        success: false,
        message: 'AI could not understand that note. Try being more specific.'
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('AI parse error:', error.message);
    res.status(500).json({ success: false, message: 'AI parse failed. Please try again.' });
  }
};

// @route   POST /api/ai/enrich
// @desc    Generate a summary + tags for a saved video/website
// @access  Private
exports.enrich = async (req, res) => {
  try {
    const { title, notes } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!aiService.isEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'AI is not configured. Set AI_API_KEY in the server environment.'
      });
    }

    const data = await aiService.enrich({ title: String(title).trim(), notes });
    if (!data) {
      return res.status(502).json({ success: false, message: 'AI enrichment failed.' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('AI enrich error:', error.message);
    res.status(500).json({ success: false, message: 'AI enrichment failed. Please try again.' });
  }
};

// @route   POST /api/ai/summarize-item
// @desc    Generate (or regenerate) the AI summary + key points for one saved item
// @access  Private
exports.summarizeItem = async (req, res) => {
  try {
    const { type, id } = req.body;
    if (!['video', 'website', 'note'].includes(type) || !id) {
      return res.status(400).json({ success: false, message: 'A valid type (video|website|note) and id are required' });
    }
    if (!aiService.isEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'AI is not configured. Set AI_API_KEY in the server environment.'
      });
    }

    let item;
    if (type === 'video') item = await Video.findOne({ _id: id, userId: req.userId });
    else if (type === 'website') item = await Website.findOne({ _id: id, userId: req.userId });
    else item = await Note.findOne({ _id: id, userId: req.userId });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const title = item.title || item.name || 'Untitled';
    const content =
      type === 'video'
        ? item.transcript || item.personalNotes || ''
        : type === 'website'
          ? item.content || item.description || ''
          : item.content || '';

    const ai = await aiService.summarizeContent({ title, content });
    if (!ai) {
      return res.status(502).json({ success: false, message: 'AI could not summarize this item.' });
    }

    item.summary = ai.summary || '';
    item.keyPoints = ai.keyPoints || [];
    await item.save();

    res.json({ success: true, data: { summary: item.summary, keyPoints: item.keyPoints } });
  } catch (error) {
    console.error('AI summarize error:', error.message);
    res.status(500).json({ success: false, message: 'AI summarization failed. Please try again.' });
  }
};

// @route   POST /api/ai/chat
// @desc    Memory-aware chat: answers with an attached item's content and a
//          compact index of the user's library. Supports quiz mode.
// @access  Private
const ITEM_MODELS = { video: Video, website: Website, note: Note };

exports.chat = async (req, res) => {
  try {
    const { message, history, context, mode } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (!aiService.isEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'AI is not configured. Set AI_API_KEY in the server environment.'
      });
    }

    // Resolve the attached item (if any) into context text
    let contextContent = null;
    if (context && context.type && context.id && ITEM_MODELS[context.type]) {
      const item = await ITEM_MODELS[context.type].findOne({ _id: context.id, userId: req.userId });
      if (item) {
        const title = item.title || item.name || 'Untitled';
        const body =
          context.type === 'video'
            ? item.transcript || item.personalNotes || ''
            : context.type === 'website'
              ? item.content || item.description || ''
              : item.content || '';
        contextContent = `Title: ${title}\nType: ${context.type}\n${String(body).replace(/\s+/g, ' ').slice(0, 6000)}`;
      }
    }

    // Compact library index so the assistant can answer "find everything about X"
    const [videos, websites, notes] = await Promise.all([
      Video.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(40).select('title tags channel watchStatus'),
      Website.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(40).select('name tags category mediaType'),
      Note.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(40).select('title tags')
    ]);
    const library = [
      ...videos.map((v) => `${v.title} — Video — ${(v.tags || []).join(', ') || v.channel || 'no tags'}`),
      ...websites.map((w) => `${w.name} — ${w.mediaType || 'Website'} — ${(w.tags || []).join(', ') || w.category || 'no tags'}`),
      ...notes.map((n) => `${n.title} — Note — ${(n.tags || []).join(', ') || 'no tags'}`)
    ];

    const result = await aiService.chatWithMemory({
      message: String(message).trim().slice(0, 2000),
      history: Array.isArray(history) ? history : [],
      context: contextContent,
      library,
      mode: mode === 'quiz' ? 'quiz' : 'chat'
    });

    if (!result) {
      return res.status(502).json({ success: false, message: 'AI could not respond. Please try again.' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI chat error:', error.message);
    res.status(500).json({ success: false, message: 'AI chat failed. Please try again.' });
  }
};

// @route   POST /api/ai/recommendations
// @desc    Suggest related topics — with an explicit topic, or derived from the
//          user's most common tag when none is given.
// @access  Private
exports.recommendations = async (req, res) => {
  try {
    const { topic } = req.body || {};
    if (!aiService.isEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'AI is not configured. Set AI_API_KEY in the server environment.'
      });
    }

    let target = String(topic || '').trim().slice(0, 80);
    if (!target) {
      const [vids, sites, notes] = await Promise.all([
        Video.find({ userId: req.userId }).select('tags').lean().limit(200),
        Website.find({ userId: req.userId }).select('tags').lean().limit(200),
        Note.find({ userId: req.userId }).select('tags').lean().limit(200)
      ]);
      const counts = {};
      [...vids, ...sites, ...notes].forEach((item) =>
        (item.tags || []).forEach((t) => {
          const key = String(t).toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        })
      );
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      target = top ? top[0] : 'productivity';
    }

    const suggestions = await aiService.suggestTopics({ topic: target });
    if (!suggestions) {
      return res.status(502).json({ success: false, message: 'AI could not generate suggestions. Please try again.' });
    }
    res.json({ success: true, data: { topic: target, suggestions } });
  } catch (error) {
    console.error('AI recommendations error:', error.message);
    res.status(500).json({ success: false, message: 'AI recommendations failed. Please try again.' });
  }
};
