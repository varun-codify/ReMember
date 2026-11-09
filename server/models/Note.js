const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    trim: true,
    maxlength: [20000, 'Note content cannot exceed 20000 characters'],
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  pinned: {
    type: Boolean,
    default: false
  },
  // AI summary + key points (generated on demand)
  summary: {
    type: String,
    default: ''
  },
  keyPoints: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Note', noteSchema);
