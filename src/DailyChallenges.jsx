import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// A small component for the challenge card
const ChallengeCard = ({ challenge }) => {
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'bg-green-600';
      case 'Medium': return 'bg-yellow-600';
      case 'Hard': return 'bg-red-600';
      case 'Insane': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };
  
  return (
    <div
      className={`bg-gray-800 border-2 rounded-lg p-6 transition ${
        challenge.completed
          ? 'border-green-500 bg-green-900/30'
          : 'border-gray-700'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{challenge.title}</h3>
        </div>
        {challenge.completed && (
          <div className="text-3xl text-green-400">✅</div>
        )}
      </div>
      <p className="text-gray-300 mb-4">{challenge.description}</p>
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
    </div>
  );
};


const DailyChallenges = () => {
  const [dailyData, setDailyData] = useState({
    loginStreak: 0,
    totalRewards: 0,
    challenges: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        const response = await fetch('/api/challenges');
        if (!response.ok) {
          throw new Error('Failed to load challenge data. Please log in again.');
        }
        const data = await response.json();
        setDailyData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallengeData();
  }, []);

  if (isLoading) {
    return <div className="text-center text-white">Loading daily challenges...</div>;
  }
  
  if (error) {
     return <div className="text-center text-red-500">{error}</div>;
  }

  const completedCount = dailyData.challenges.filter(c => c.completed).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">🎯 Daily Challenges</h1>
            <p className="text-gray-400">Complete challenges by playing games to earn points!</p>
          </div>
          <Link to="/menu" className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition">
            ← Back to Menu
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">🔥 Login Streak</h2>
            <div className="text-5xl font-bold">{dailyData.loginStreak}</div>
            <p className="text-orange-100">Consecutive days</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">💎 Total Points</h2>
            <div className="text-5xl font-bold">{dailyData.totalRewards}</div>
            <p className="text-yellow-100">Points earned from challenges</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">📊 Today's Progress</h2>
           <span className="text-lg">Challenges Completed: <span className="font-bold text-cyan-400">{completedCount} / {dailyData.challenges.length}</span></span>
          <div className="w-full bg-gray-700 rounded-full h-3 mt-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / dailyData.challenges.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-6">🎮 Today's Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dailyData.challenges.map(challenge => (
            <ChallengeCard key={challenge.challengeId} challenge={challenge} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyChallenges;