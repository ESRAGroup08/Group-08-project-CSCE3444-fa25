
// ranking.js
// Player Ranking System (FR-07) - starter module
//
// Responsibilities:
// - maintain player ratings (ELO-like) for ranked matchmaking
// - compute a transient skill score from raw typing stats for seeding and casual use
// - update ratings after games and expose lookup helpers
// - provide hooks / utility functions for server integration (get, set, persist)
//
// Self-Notes:
// - This is an in-memory starter implementation. Replace the storage layer with a DB adapter
//   for persistence across restarts (e.g., PostgreSQL, MongoDB).
// - Improve weights, K_FACTOR, and normalization according to playtesting.

const DEFAULT_RATING = 1000;     // starting rating for new players
const K_FACTOR = 32;             // ELO K-factor (how fast ratings change)
const MIN_RATING = 0;            // floor
const MAX_RATING = 9999;         // optional cap

// Internal in-memory storage: Map<username, { rating, gamesPlayed, wpmAvg, accuracyAvg, winCount }>
const players = new Map();

// --- Helper / normalization utilities ---

// Normalize accuracy (expected 0..100) to 0..1
function normAccuracy(accuracy) {
  if (accuracy == null || Number.isNaN(accuracy)) return 0;
  return Math.max(0, Math.min(1, accuracy / 100));
}

// Normalize winRate (0..1 expected)
function normWinRate(winRate) {
  if (winRate == null || Number.isNaN(winRate)) return 0;
  return Math.max(0, Math.min(1, winRate));
}

// Normalize WPM: map typical range to 0..1. Adjust maxWpm based on observed distribution.
function normWpm(wpm, maxWpm = 120) {
  if (wpm == null || Number.isNaN(wpm)) return 0;
  return Math.max(0, Math.min(1, wpm / maxWpm));
}

// --- Public API ---

// computeSkillScore(stats)
// stats: { wpm, accuracy (0..100), winRate (0..1) }
// returns a 0..100 (or other) composite score used for casual matching or seeding
function computeSkillScore(stats = {}) {
  const { wpm = 0, accuracy = 0, winRate = 0 } = stats;
  // Tunable weights:
  const W_WPM = 0.7;
  const W_ACC = 0.2;
  const W_WIN = 0.1;

  const sWpm = normWpm(wpm);
  const sAcc = normAccuracy(accuracy);
  const sWin = normWinRate(winRate);

  // score in 0..1 range — scale to more convenient range if desired
  const score01 = (sWpm * W_WPM) + (sAcc * W_ACC) + (sWin * W_WIN);
  // scale to 0..100 for readability
  return Math.round(score01 * 100);
}

// getRating(username)
// returns numeric rating; returns DEFAULT_RATING when unknown
function getRating(username) {
  const rec = players.get(username);
  return rec ? rec.rating : DEFAULT_RATING;
}

// setRating(username, rating)
// force-set rating (useful for admin tools / DB sync)
function setRating(username, rating) {
  const r = Math.round(Math.max(MIN_RATING, Math.min(MAX_RATING, rating)));
  const existing = players.get(username) || { rating: r, gamesPlayed: 0, wpmAvg: 0, accuracyAvg: 0, winCount: 0 };
  existing.rating = r;
  players.set(username, existing);
  return existing.rating;
}

// ensurePlayer(username, optionalStats)
// create a player record if missing; optionally seed with stats
function ensurePlayer(username, stats = {}) {
  if (!players.has(username)) {
    const initial = {
      rating: DEFAULT_RATING,
      gamesPlayed: 0,
      wpmAvg: stats.wpm || 0,
      accuracyAvg: stats.accuracy || 0,
      winCount: (stats.winRate != null) ? Math.round((stats.winRate || 0) * (stats.gamesPlayed || 0)) : 0,
    };
    players.set(username, initial);
  }
  return players.get(username);
}

// expectedScore rating helper (ELO formula)
function expectedScore(rA, rB) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

// updateRatings(playerA, playerB, resultForA, opts)
// resultForA: 1 = A won, 0 = A lost, 0.5 = draw
// opts: { kFactor } optional override
// returns updated ratings object { playerA: newRatingA, playerB: newRatingB }
function updateRatings(playerA, playerB, resultForA, opts = {}) {
  ensurePlayer(playerA);
  ensurePlayer(playerB);

  const rA = getRating(playerA);
  const rB = getRating(playerB);
  const k = opts.kFactor || K_FACTOR;

  const eA = expectedScore(rA, rB);
  const eB = expectedScore(rB, rA);

  const newA = Math.round(rA + k * (resultForA - eA));
  const newB = Math.round(rB + k * ((1 - resultForA) - eB));

  setRating(playerA, newA);
  setRating(playerB, newB);

  // Update simple player stats counters (games played, win count) for telemetry
  const recA = players.get(playerA);
  const recB = players.get(playerB);
  recA.gamesPlayed = (recA.gamesPlayed || 0) + 1;
  recB.gamesPlayed = (recB.gamesPlayed || 0) + 1;
  if (resultForA === 1) recA.winCount = (recA.winCount || 0) + 1;
  if (resultForA === 0) recB.winCount = (recB.winCount || 0) + 1;
  players.set(playerA, recA);
  players.set(playerB, recB);

  return { [playerA]: getRating(playerA), [playerB]: getRating(playerB) };
}

// recordMatchStats(username, stats)
// called after a game to update rolling averages (wpmAvg, accuracyAvg)
function recordMatchStats(username, stats = {}) {
  const rec = ensurePlayer(username);
  const games = (rec.gamesPlayed || 0);
  // update averages as running average (prior to incrementing gamesPlayed)
  const prevGames = games;
  const newGames = prevGames + 1;

  // stats fields: wpm, accuracy (0..100)
  const wpm = stats.wpm != null ? stats.wpm : rec.wpmAvg || 0;
  const acc = stats.accuracy != null ? stats.accuracy : rec.accuracyAvg || 0;

  rec.wpmAvg = ((rec.wpmAvg || 0) * prevGames + wpm) / newGames;
  rec.accuracyAvg = ((rec.accuracyAvg || 0) * prevGames + acc) / newGames;
  // gamesPlayed increment intentionally happens in updateRatings or separately if unranked
  players.set(username, rec);
  return rec;
}

// export an iterator for diagnostics or persistence sync
function listAllPlayers() {
  const out = [];
  for (const [username, rec] of players.entries()) {
    out.push({ username, ...rec });
  }
  return out;
}

// persistence hooks - placeholders: implement DB-backed save/load
async function persistAllToDb(saveFn /* async (username, record) => {} */) {
  // Example: iterate players and call saveFn
  for (const [username, rec] of players.entries()) {
    /* await */ saveFn && (await saveFn(username, rec));
  }
}

async function loadFromDb(loadFn /* async () => Array<{username, record}> */) {
  if (!loadFn) return;
  const all = await loadFn();
  for (const item of all) {
    players.set(item.username, item.record);
  }
}

// clear in-memory (for tests)
function clearAll() {
  players.clear();
}

// --- Exports ---
module.exports = {
  // constants
  DEFAULT_RATING,
  K_FACTOR,
  // score functions
  computeSkillScore,
  normWpm,
  normAccuracy,
  normWinRate,
  // rating API
  getRating,
  setRating,
  ensurePlayer,
  updateRatings,
  expectedScore,
  // stats
  recordMatchStats,
  listAllPlayers,
  // persistence helpers
  persistAllToDb,
  loadFromDb,
  // test utilities
  clearAll,
};