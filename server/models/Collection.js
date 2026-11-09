const mongoose = require('mongoose');

// A "smart collection": a named, rule-based view over the user's saved items
// (videos, websites, notes). Items are matched on the fly from the rule —
// nothing is stored per-item, so collections stay automatically up to date.
const collectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Collection name is required'],
    trim: true,
    maxlength: [80, 'Collection name cannot exceed 80 characters']
  },
  icon: {
    type: String,
    default: '🗂'
  },
  // Matches the neo-icon-* CSS classes: blue | pink | green | yellow | coral | purple
  color: {
    type: String,
    default: 'blue'
  },
  rule: {
    // Which item types to include (empty = all)
    types: [{
      type: String,
      enum: ['video', 'website', 'note']
    }],
    // Website categories (ai, productivity, learning, ...)
    categories: [{
      type: String
    }],
    // Match items carrying any of these tags
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    // Websites only — restrict to favorites
    favoritesOnly: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Collection', collectionSchema);
