// ranking.js - Database-Aware ELO System

const mongoose = require('mongoose');
const K_FACTOR = 32; // How fast ratings change
const DEFAULT_RATING = 1000;

// This is the core of the fix. Instead of looking up the model once at the top,
// we look it up inside each function. This breaks the circular dependency and
// ensures the model is registered before we try to use it.

/**
 * Gets the ELO rating for a user from the database.
 * @param {string} username - The player's username.
 * @returns {Promise<number>} - The player's ELO rating.
 */
async function getRating(username) {
  const User = mongoose.model('User');
  const user = await User.findOne({ username }).select('eloRating');
  return user ? user.eloRating : DEFAULT_RATING;
}

/**
 * The core ELO calculation for expected score.
 * @param {number} rA - Rating of player A.
 * @param {number} rB - Rating of player B.
 * @returns {number} - The probability of player A winning.
 */
function expectedScore(rA, rB) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

/**
 * Updates the ELO ratings for two players after a match and saves to the database.
 * @param {string} winnerUsername - The username of the winner.
 * @param {string} loserUsername - The username of the loser.
 * @returns {Promise<object>} - An object with the new ratings.
 */
async function updateRatings(winnerUsername, loserUsername) {
  const User = mongoose.model('User');
  const rA = await getRating(winnerUsername); // Winner's rating
  const rB = await getRating(loserUsername);  // Loser's rating

  const eA = expectedScore(rA, rB); // Winner's expected score
  const eB = expectedScore(rB, rA); // Loser's expected score

  // Calculate new ratings
  const newRatingA = Math.round(rA + K_FACTOR * (1 - eA));
  const newRatingB = Math.round(rB + K_FACTOR * (0 - eB));

  // Update both users in the database
  await User.updateOne({ username: winnerUsername }, { $set: { eloRating: newRatingA } });
  await User.updateOne({ username: loserUsername }, { $set: { eloRating: newRatingB } });

  return {
    [winnerUsername]: newRatingA,
    [loserUsername]: newRatingB,
  };
}


// --- EXPORTS ---
module.exports = {
  getRating,
  updateRatings,
  expectedScore,
};