
// casualMatchmaking.js
// FR-08: Unranked / Casual Matchmaking module
//
// Responsibilities:
// - Manage a queue of players seeking casual (unranked) matches
// - Match players with similar transient skill (computed from recent stats)
// - Gradually relax matching threshold as players wait to reduce wait times
// - Handle timeouts, disconnects, and queue removal
// - Provide hooks for the server to notify sockets (no direct socket.io dependency here)
//
// Usage (server):
// const casual = require('./casualMatchmaking');
// const opponent = casual.enqueue({ socket, username, stats });
// if (opponent) { /* start match */ } else { /* wait */ }
//
// The module is intentionally dependency-free so it is easy to unit-test and to reuse.

const DEFAULT_OPTIONS = {
  thresholdBase: 15,     // initial allowed difference in skillScore
  expandPerSecond: 5,    // how much the threshold widens per second of waiting
  maxThreshold: 100,     // cap on threshold widening
  maxQueueTimeSec: 60,   // remove stale entries after this many seconds (optional)
  pairCooldownMs: 1000,  // optional small cooldown to avoid immediate re-pairing loops
};

// Internal queue: array of entries
// entry = {
//   id: a unique id (string)
//   socket: reference (opaque to module, used for matching removal by server)
//   username: string
//   stats: { wpm, accuracy, winRate, gamesPlayed }
//   skillScore: number (0..100 computed by server ranking.computeSkillScore or locally prior to enqueue)
//   enqueuedAt: timestamp (ms)
//   lastPairedAt: timestamp (ms) optional to avoid immediate repeat matches
// }
const QUEUE = [];

// Utility: generate short unique id for queue entries
function makeId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Public: compute dynamic threshold based on how long each player has waited
function computeDynamicThreshold(base, expandPerSecond, waitedSec, waitedOtherSec, maxThreshold) {
  const waited = Math.max(0, Math.floor(Math.max(waitedSec, waitedOtherSec)));
  const dynamic = base + expandPerSecond * waited;
  return Math.min(dynamic, maxThreshold);
}

// Public: enqueue a player and try to find a match immediately.
// params:
//  - entryIn: { socket, username, stats, skillScore } (skillScore optional; if omitted compute must be done before calling)
//  - opts: overrides for options (optional)
// Returns:
//  - If a match found: { matched: true, opponent: opponentEntry, self: entry }
//  - If no match: { matched: false, entry: enqueuedEntry }
function enqueue(entryIn = {}, opts = {}) {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  if (!entryIn || !entryIn.socket || !entryIn.username) {
    throw new Error('enqueue requires { socket, username, stats, skillScore }');
  }

  const now = Date.now();
  const entry = {
    id: makeId(),
    socket: entryIn.socket,
    username: entryIn.username,
    stats: entryIn.stats || {},
    skillScore: typeof entryIn.skillScore === 'number' ? entryIn.skillScore : (entryIn.stats ? Math.round((entryIn.stats.wpm || 0) * 0.7 + (entryIn.stats.accuracy || 0) * 0.2 + ((entryIn.stats.winRate || 0) * 100) * 0.1) : 0),
    enqueuedAt: now,
    lastPairedAt: 0,
  };

  // Clean stale entries first
  purgeStale(options.maxQueueTimeSec);

  // Attempt to find an opponent
  for (let i = 0; i < QUEUE.length; i++) {
    const other = QUEUE[i];

    // Don't match same socket or immediate re-pair within cooldown
    if (other.socket === entry.socket) continue;
    if (other.lastPairedAt && (now - other.lastPairedAt) < options.pairCooldownMs) continue;
    if (entry.lastPairedAt && (now - entry.lastPairedAt) < options.pairCooldownMs) continue;

    const waitedOther = (now - other.enqueuedAt) / 1000;
    const waitedSelf = (now - entry.enqueuedAt) / 1000;
    const dynamicThreshold = computeDynamicThreshold(options.thresholdBase, options.expandPerSecond, waitedSelf, waitedOther, options.maxThreshold);

    if (Math.abs(other.skillScore - entry.skillScore) <= dynamicThreshold) {
      // remove opponent from queue
      QUEUE.splice(i, 1);
      // set lastPairedAt to avoid immediate rematching
      other.lastPairedAt = now;
      entry.lastPairedAt = now;
      return { matched: true, opponent: other, self: entry };
    }
  }

  // No match: push to queue
  QUEUE.push(entry);
  return { matched: false, entry };
}

// Public: remove a queued entry by predicate (e.g., socket or username). Returns removed entry or null.
function remove(predicate) {
  const idx = QUEUE.findIndex(predicate);
  if (idx === -1) return null;
  return QUEUE.splice(idx, 1)[0];
}

// Convenience: remove by socket identity (server will call this on disconnect)
function removeBySocket(socket) {
  return remove((e) => e.socket === socket);
}

// Public: peek queue for diagnostics (shallow copy)
function listQueue() {
  return QUEUE.map((e) => ({ id: e.id, username: e.username, skillScore: e.skillScore, enqueuedAt: e.enqueuedAt }));
}

// Public: purge entries older than maxAgeSec. Returns number removed.
function purgeStale(maxAgeSec = DEFAULT_OPTIONS.maxQueueTimeSec) {
  if (!maxAgeSec || maxAgeSec <= 0) return 0;
  const now = Date.now();
  const before = QUEUE.length;
  for (let i = QUEUE.length - 1; i >= 0; i--) {
    const e = QUEUE[i];
    if ((now - e.enqueuedAt) > (maxAgeSec * 1000)) {
      QUEUE.splice(i, 1);
    }
  }
  return before - QUEUE.length;
}

// Public: clear queue (testing/admin)
function clearQueue() {
  QUEUE.length = 0;
}

// Export API
module.exports = {
  enqueue,
  remove,
  removeBySocket,
  listQueue,
  purgeStale,
  clearQueue,
  // expose internal queue for debug/tests (read-only recommended)
  _QUEUE: QUEUE,
  DEFAULT_OPTIONS,
};