// --- NEW: Import the Redis client ---
const redisClient = require('./redisClient');

// The queue is no longer an in-memory array. Redis will manage it.
// const QUEUE = []; // This is no longer needed

const DEFAULT_OPTIONS = {
  thresholdBase: 15,     // initial allowed difference in skillScore
  expandPerSecond: 5,    // how much the threshold widens per second of waiting
  maxThreshold: 100,     // cap on threshold widening
  maxQueueTimeSec: 60,   // remove stale entries after this many seconds (optional)
  // --- NEW: Define a prefix for our Redis keys ---
  queuePrefix: 'matchmaking:casual',
};

// --- NEW: Helper to get the Redis key for a given skill score ---
function getQueueKey(skillScore) {
  // Group players into buckets of 20 skill points.
  // e.g., skill 0-19 -> bucket 0, 20-39 -> bucket 1, etc.
  const bucket = Math.floor(skillScore / 20);
  return `${DEFAULT_OPTIONS.queuePrefix}:${bucket}`;
}

// --- REFACTORED: The enqueue function is now async and uses Redis ---
async function enqueue(entryIn = {}) {
  if (!entryIn || !entryIn.socket || !entryIn.username || typeof entryIn.skillScore !== 'number') {
    throw new Error('enqueue requires { socket, username, skillScore }');
  }

  const { socket, username, skillScore } = entryIn;
  const now = Date.now();

  // The unique ID for a player in the queue will be their socket.id
  const playerId = socket.id;

  // Store player data in a Redis Hash for quick lookups
  // This replaces storing the whole object in the old QUEUE array.
  const playerDataKey = `player:${playerId}`;
  await redisClient.hSet(playerDataKey, {
    username,
    skillScore: skillScore.toString(),
    enqueuedAt: now.toString(),
  });
  // Set an expiration on this player data to auto-clean it
  await redisClient.expire(playerDataKey, DEFAULT_OPTIONS.maxQueueTimeSec);


  // --- Matchmaking Logic ---
  const queueKey = getQueueKey(skillScore);
  const searchRadius = DEFAULT_OPTIONS.thresholdBase; // Start with the base threshold

  // Search for an opponent with a similar score in the same bucket
  // ZRANGEBYSCORE lets us find players within a score range.
  const potentialOpponents = await redisClient.zRangeByScore(
    queueKey,
    skillScore - searchRadius,
    skillScore + searchRadius
  );

  let opponentId = potentialOpponents.find(id => id !== playerId); // Don't match with self

  if (opponentId) {
    // --- MATCH FOUND ---

    // Atomically remove the opponent from the queue to prevent race conditions
    const removed = await redisClient.zRem(queueKey, opponentId);

    if (removed > 0) {
      console.log(`[MM-Redis] Match found for ${username} with ${opponentId}.`);
      
      // Retrieve opponent's data from Redis
      const opponentData = await redisClient.hGetAll(`player:${opponentId}`);

      // Clean up player data from Redis
      await redisClient.del(playerDataKey);
      await redisClient.del(`player:${opponentId}`);

      return {
        matched: true,
        opponent: { 
          socketId: opponentId, // The server will need the socket ID
          username: opponentData.username,
          skillScore: parseFloat(opponentData.skillScore)
        },
        self: { 
          socketId: playerId,
          username: username,
          skillScore: skillScore
        },
      };
    }
  }

  // --- NO MATCH FOUND: Add player to the queue ---
  console.log(`[MM-Redis] No match found for ${username}. Adding to queue.`);

  // Add the player to the sorted set. The `skillScore` is used for sorting.
  // The 'NX' option means this will only add the member if it's not already there.
  await redisClient.zAdd(queueKey, { score: skillScore, value: playerId }, { NX: true });
  
  return { matched: false, entry: { socketId: playerId, username, skillScore } };
}

// --- REFACTORED: remove function to use Redis ---
async function removeBySocketId(socketId) {
  // We need to find which queue the player was in.
  // This is a simplification; a real implementation might need to scan buckets.
  // For now, we assume we can reconstruct the key or we remove it when we know it.
  const playerData = await redisClient.hGetAll(`player:${socketId}`);
  if (playerData.skillScore) {
      const queueKey = getQueueKey(parseFloat(playerData.skillScore));
      await redisClient.zRem(queueKey, socketId);
  }
  await redisClient.del(`player:${socketId}`);
  console.log(`[MM-Redis] Removed ${socketId} from matchmaking.`);
}

// Public: clear all casual matchmaking keys (for testing/admin)
async function clearQueue() {
  const stream = redisClient.scanIterator({
    MATCH: `${DEFAULT_OPTIONS.queuePrefix}:*`,
    COUNT: 100,
  });
  for await (const key of stream) {
    await redisClient.del(key);
  }
  console.log('[MM-Redis] All casual matchmaking queues cleared.');
}

// Export the new API
module.exports = {
  enqueue,
  removeBySocketId,
  clearQueue,
  DEFAULT_OPTIONS,
};