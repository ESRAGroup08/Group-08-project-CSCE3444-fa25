import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DailyChallenges = () => {
  const [userData, setUserData] = useState({
    loginStreak: 0,
    lastLoginDate: null,
    totalLogins: 0,
    challengesCompleted: 0,
    totalRewards: 0
  });

  const [challenges, setChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [success, setSuccess] = useState('');

  const username = localStorage.getItem('username') || 'Player';

  // Daily challenges data
  const availableChallenges = [
    {
      id: 1,
      title: '⚡ Speed Demon',
      description: 'Reach 100 WPM in a single game',
      reward: 50,
      difficulty: 'Hard',
      icon: '🚀',
      color: 'from-red-600 to-orange-600'
    },
    {
      id: 2,
      title: '🎯 Accuracy Master',
      description: 'Achieve 95% accuracy or higher',
      reward: 40,
      difficulty: 'Medium',
      icon: '🎯',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: 3,
      title: '🏆 Victory Streak',
      description: 'Win 3 consecutive games',
      reward: 60,
      difficulty: 'Hard',
      icon: '🏆',
      color: 'from-yellow-600 to-orange-600'
    },
    {
      id: 4,
      title: '⏱️ Time Trial',
      description: 'Complete a game in under 2 minutes',
      reward: 35,
      difficulty: 'Easy',
      icon: '⏱️',
      color: 'from-purple-600 to-pink-600'
    },
    {
      id: 5,
      title: '🌟 Flawless Round',
      description: 'Complete a game with 100% accuracy',
      reward: 75,
      difficulty: 'Insane',
      icon: '✨',
      color: 'from-pink-600 to-rose-600'
    },
    {
      id: 6,
      title: '🎪 Marathon Mode',
      description: 'Play for 30 minutes straight',
      reward: 45,
      difficulty: 'Medium',
      icon: '🎪',
      color: 'from-green-600 to-emerald-600'
    }
  ];

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`dailyData_${username}`);
    const savedChallenges = localStorage.getItem(`completedChallenges_${username}`);
    
    if (savedData) {
      const data = JSON.parse(savedData);
      // Check if it's a new day
      const today = new Date().toDateString();
      if (data.lastLoginDate !== today) {
        // New day - reset challenges and increment login
        data.lastLoginDate = today;
        data.loginStreak += 1;
        data.totalLogins += 1;
        setUserData(data);
        localStorage.setItem(`dailyData_${username}`, JSON.stringify(data));
      } else {
        setUserData(data);
      }
    } else {
      // First login
      const newData = {
        loginStreak: 1,
        lastLoginDate: new Date().toDateString(),
        totalLogins: 1,
        challengesCompleted: 0,
        totalRewards: 0
      };
      setUserData(newData);
      localStorage.setItem(`dailyData_${username}`, JSON.stringify(newData));
    }

    if (savedChallenges) {
      setCompletedChallenges(JSON.parse(savedChallenges));
    }
  }, [username]);

  const handleCompleteChallenge = (challengeId) => {
    if (completedChallenges.includes(challengeId)) {
      setSuccess('✓ Challenge already completed today!');
      return;
    }

    const challenge = availableChallenges.find(c => c.id === challengeId);
    const newCompleted = [...completedChallenges, challengeId];
    
    setCompletedChallenges(newCompleted);
    localStorage.setItem(`completedChallenges_${username}`, JSON.stringify(newCompleted));

    const updatedData = {
      ...userData,
      challengesCompleted: userData.challengesCompleted + 1,
      totalRewards: userData.totalRewards + challenge.reward
    };
    setUserData(updatedData);
    localStorage.setItem(`dailyData_${username}`, JSON.stringify(updatedData));

    setSuccess(`🎉 Challenge completed! You earned ${challenge.reward} points!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const claimLoginReward = () => {
    if (userData.lastLoginDate === new Date().toDateString()) {
      const loginBonus = Math.min(userData.loginStreak * 10, 100);
      const updatedData = {
        ...userData,
        totalRewards: userData.totalRewards + loginBonus
      };
      setUserData(updatedData);
      localStorage.setItem(`dailyData_${username}`, JSON.stringify(updatedData));
      setSuccess(`✓ Login reward claimed! +${loginBonus} points!`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const resetDailyChallenges = () => {
    if (window.confirm('Reset daily challenges? This cannot be undone.')) {
      setCompletedChallenges([]);
      localStorage.setItem(`completedChallenges_${username}`, JSON.stringify([]));
      setSuccess('✓ Daily challenges reset for tomorrow!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy':
        return 'bg-green-600';
      case 'Medium':
        return 'bg-yellow-600';
      case 'Hard':
        return 'bg-red-600';
      case 'Insane':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">🎯 Daily Challenges</h1>
            <p className="text-gray-400">Complete daily challenges to earn rewards!</p>
          </div>
          <Link to="/menu" className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition">
            ← Back to Menu
          </Link>
        </div>

        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 text-center">
            {success}
          </div>
        )}

        {/* Login Streak Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Login Streak */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">🔥 Login Streak</h2>
            <div className="text-5xl font-bold mb-2">{userData.loginStreak}</div>
            <p className="text-orange-100 mb-4">Consecutive days</p>
            <button
              onClick={claimLoginReward}
              className="w-full bg-white text-orange-600 font-bold py-2 rounded-lg hover:bg-orange-50 transition"
            >
              📦 Claim Daily Reward
            </button>
          </div>

          {/* Total Logins */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">📅 Total Logins</h2>
            <div className="text-5xl font-bold mb-2">{userData.totalLogins}</div>
            <p className="text-blue-100">Total times logged in</p>
          </div>

          {/* Total Rewards */}
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">💎 Total Rewards</h2>
            <div className="text-5xl font-bold mb-2">{userData.totalRewards}</div>
            <p className="text-yellow-100">Points earned</p>
          </div>
        </div>

        {/* Challenges Stats */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">📊 Today's Progress</h2>
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg">Challenges Completed: <span className="font-bold text-cyan-400">{completedChallenges.length} / {availableChallenges.length}</span></span>
            <button
              onClick={resetDailyChallenges}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm transition"
            >
              🔄 Reset for Tomorrow
            </button>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(completedChallenges.length / availableChallenges.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Daily Challenges Grid */}
        <h2 className="text-3xl font-bold mb-6">🎮 Today's Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableChallenges.map(challenge => (
            <div
              key={challenge.id}
              className={`bg-gray-800 border-2 rounded-lg p-6 transition transform hover:scale-105 ${
                completedChallenges.includes(challenge.id)
                  ? 'border-green-500 bg-green-900/30'
                  : 'border-gray-700 hover:border-cyan-500'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-4xl mb-2">{challenge.icon}</div>
                  <h3 className="text-xl font-bold">{challenge.title}</h3>
                </div>
                {completedChallenges.includes(challenge.id) && (
                  <div className="text-3xl">✅</div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-4">{challenge.description}</p>

              {/* Footer */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <span className={`${getDifficultyColor(challenge.difficulty)} px-3 py-1 rounded-full text-sm font-bold`}>
                    {challenge.difficulty}
                  </span>
                  <span className="bg-yellow-600 px-3 py-1 rounded-full text-sm font-bold">
                    +{challenge.reward} pts
                  </span>
                </div>
              </div>

              {/* Complete Button */}
              <button
                onClick={() => handleCompleteChallenge(challenge.id)}
                disabled={completedChallenges.includes(challenge.id)}
                className={`w-full mt-4 py-2 rounded-lg font-bold transition ${
                  completedChallenges.includes(challenge.id)
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-white cursor-pointer'
                }`}
              >
                {completedChallenges.includes(challenge.id) ? '✓ Completed' : 'Complete Challenge'}
              </button>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gray-800 border border-cyan-500 p-6 rounded-lg">
          <h3 className="text-2xl font-bold mb-4">💡 How It Works</h3>
          <ul className="space-y-2 text-gray-300">
            <li>✓ Log in daily to build your login streak and earn rewards</li>
            <li>✓ Complete challenges to earn bonus points</li>
            <li>✓ Longer streaks mean bigger login bonuses!</li>
            <li>✓ Challenges reset every day at midnight</li>
            <li>✓ Keep your streak alive by logging in every day</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DailyChallenges;
