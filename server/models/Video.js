const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required'],
    trim: true
  },
  videoId: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  personalNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true
  }],
  watchStatus: {
    type: String,
    enum: ['not-watched', 'in-progress', 'completed'],
    default: 'not-watched'
  },
  duration: {
    type: String,
    default: ''
  },
  channel: {
    type: String,
    default: ''
  },
  lastWatchedAt: {
    type: Date
  },
  clickCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Video', videoSchema);
