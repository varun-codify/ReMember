const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Website/tool name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['ai', 'productivity', 'learning', 'utilities', 'development', 'design', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  lastVisited: {
    type: Date,
    default: null
  },
  // Universal capture: what kind of link is this?
  mediaType: {
    type: String,
    enum: ['webpage', 'pdf', 'image', 'github'],
    default: 'webpage'
  },
  // Extracted page/PDF text — powers full-text search
  content: {
    type: String,
    default: ''
  },
  // AI summary + key points
  summary: {
    type: String,
    default: ''
  },
  keyPoints: [{
    type: String
  }],
  // Continue-reading support (0–100)
  readingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // GitHub repo metadata
  githubStars: {
    type: Number,
    default: 0
  },
  githubLanguage: {
    type: String,
    default: ''
  },
  githubDescription: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Website', websiteSchema);
