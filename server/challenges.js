// This map defines all possible challenges in the game.
// The `key` is a unique identifier.
// The `check` function determines if a challenge is completed based on game results.
const challenges = new Map([
  [
    'SPEED_DEMON',
    {
      title: '⚡ Speed Demon',
      description: 'Reach 100 WPM in a single game',
      reward: 15,
      difficulty: 'Hard',
      check: (gameStats) => gameStats.wpm >= 100,
    },
  ],
  [
    'ACCURACY_MASTER',
    {
      title: '🎯 Accuracy Master',
      description: 'Achieve 95% accuracy or higher in a game',
      reward: 10,
      difficulty: 'Medium',
      check: (gameStats) => gameStats.accuracy >= 95,
    },
  ],
  [
    'VICTORY_STREAK',
    {
      title: '🏆 Victory Streak',
      description: 'Win 3 consecutive games',
      reward: 15,
      difficulty: 'Hard',
      // This check depends on a `consecutiveWins` counter on the user object
      check: (gameStats, user) => gameStats.isWin && user.dailyStats.consecutiveWins >= 3,
    },
  ],
  [
    'FLAWLESS_ROUND',
    {
      title: '🌟 Flawless Round',
      description: 'Complete a game with 100% accuracy',
      reward: 20,
      difficulty: 'Insane',
      check: (gameStats) => gameStats.accuracy === 100,
    },
  ],
  [
    'FIRST_WIN',
     {
      title: '🥇 First Win of the Day',
      description: 'Win your first game of the day',
      reward: 5,
      difficulty: 'Easy',
      check: (gameStats, user) => gameStats.isWin && user.dailyStats.winsToday === 1,
    }
  ]
]);

// Function to get a random set of daily challenges
function getDailyChallenges(count = 3) {
  const allKeys = Array.from(challenges.keys());
  const dailyKeys = [];
  while (dailyKeys.length < count && allKeys.length > 0) {
    const randomIndex = Math.floor(Math.random() * allKeys.length);
    dailyKeys.push(allKeys.splice(randomIndex, 1)[0]);
  }
  return dailyKeys.map(key => ({
    challengeId: key,
    completed: false,
    ...challenges.get(key) // Add title, description, etc.
  }));
}

module.exports = { challenges, getDailyChallenges };