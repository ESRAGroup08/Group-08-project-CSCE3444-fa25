const mongoose = require('mongoose');

// Define User schema
const userSchema = new mongoose.Schema({
  googleId: { type: String, sparse: true, unique: true },
  username: { type: String, required: true, unique: true, trim: true },
  gamesPlayed: { type: Number, default: 0 },
  averageWPM: { type: Number, default: 0 },
  averageAccuracy: { type: Number, default: 0 },
  rating: { type: Number, default: 1000 }, // ELO rating
  winStreak: { type: Number, default: 0 }, // For tracking consecutive wins
  challengesLastReset: { type: Date, default: () => new Date(0) }, // Initialize to a long time ago
  dailyChallenges: [{
    challengeId: String,
    description: String,
    reward: Number,
    progress: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    completed: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;