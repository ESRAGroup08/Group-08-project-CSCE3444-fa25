const { createClient } = require('redis');

// Initialize the Redis client
const redisClient = createClient({
  // If your Redis server is not on localhost, configure the URL here:
  // url: 'redis://your-redis-host:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Connect to Redis. We only need to do this once.
redisClient.connect().catch(console.error);

module.exports = redisClient;