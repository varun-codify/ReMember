const Note = require('../models/Note');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @route   GET /api/notes
// @desc    Get all notes for the current user (supports ?q= search)
// @access  Private
exports.getAllNotes = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { userId: req.userId };
    if (q && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
    }

    const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 });

    res.json({ success: true, count: notes.length, data: notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ success: false, message: 'Error fetching notes' });
  }
};

// @route   GET /api/notes/:id
// @access  Private
exports.getNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ success: false, message: 'Error fetching note' });
  }
};

// @route   POST /api/notes
// @access  Private
exports.createNote = async (req, res) => {
  try {
    const { title, content, tags, pinned } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Note title is required' });
    }

    const note = new Note({
      userId: req.userId,
      title: String(title).trim(),
      content: content || '',
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [],
      pinned: !!pinned
    });

    await note.save();

    res.status(201).json({ success: true, message: 'Note saved successfully', data: note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ success: false, message: 'Error saving note' });
  }
};

// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const { title, content, tags, pinned } = req.body;
    if (title !== undefined) note.title = String(title).trim();
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [];
    if (pinned !== undefined) note.pinned = !!pinned;

    await note.save();

    res.json({ success: true, message: 'Note updated successfully', data: note });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ success: false, message: 'Error updating note' });
  }
};

// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, message: 'Error deleting note' });
  }
};
