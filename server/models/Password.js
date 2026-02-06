const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const passwordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  websiteName: {
    type: String,
    required: [true, 'Website name is required'],
    trim: true
  },
  websiteUrl: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username/email is required'],
    trim: true
  },
  encryptedPassword: {
    type: String,
    required: [true, 'Password is required']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['social', 'work', 'finance', 'shopping', 'entertainment', 'other'],
    default: 'other'
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encrypt password before saving
passwordSchema.pre('save', function(next) {
  if (!this.isModified('encryptedPassword')) return next();
  
  // Encrypt using AES (in production, use a more robust solution)
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  this.encryptedPassword = CryptoJS.AES.encrypt(
    this.encryptedPassword,
    encryptionKey
  ).toString();
  
  next();
});

// Method to decrypt password
passwordSchema.methods.decryptPassword = function() {
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  const bytes = CryptoJS.AES.decrypt(this.encryptedPassword, encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = mongoose.model('Password', passwordSchema);
