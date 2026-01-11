import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // For a nice loading spinner

const DailyChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const username = localStorage.getItem('username') || 'Player';

  useEffect(() => {
    const fetchChallenges = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/challenges', {
          headers: { 'x-username': username }
        });
        if (!response.ok) {
          throw new Error('Failed to load challenges. Please try again.');
        }
        const data = await response.json();
        setChallenges(data.dailyChallenges || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, [username]);

  const getDifficultyColor = (reward) => {
    if (reward >= 50) return 'bg-purple-600';
    if (reward >= 30) return 'bg-red-600';
    if (reward >= 20) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">🎯 Daily Challenges</h1>
            <p className="text-gray-400">Complete challenges to boost your ELO rating!</p>
          </div>
          <Link to="/menu" className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition">
            ← Back to Menu
          </Link>
        </div>

        {error && <div className="bg-red-600 text-white p-4 rounded-lg mb-6 text-center">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {challenges.map(challenge => (
            <div
              key={challenge.challengeId}
              className={`bg-gray-800 border-2 rounded-lg p-6 transition transform hover:scale-105 ${
                challenge.completed
                  ? 'border-green-500 bg-green-900/30'
                  : 'border-gray-700 hover:border-cyan-500'
              }`}
            >
              <h3 className="text-xl font-bold mb-2">{challenge.description}</h3>
              
              <div className="w-full bg-gray-700 rounded-full h-3 my-4">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-300 mb-4">
                <span>Progress: {challenge.progress} / {challenge.target}</span>
                {challenge.completed && <span className="font-bold text-green-400">✓ COMPLETED</span>}
              </div>
              
              <div className="flex justify-between items-center">
                  <span className={`${getDifficultyColor(challenge.reward)} px-3 py-1 rounded-full text-sm font-bold`}>
                    +{challenge.reward} ELO
                  </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-800 border border-cyan-500 p-6 rounded-lg">
          <h3 className="text-2xl font-bold mb-4">💡 How It Works</h3>
          <ul className="space-y-2 text-gray-300 list-disc list-inside">
            <li>Your daily challenges reset automatically each day.</li>
            <li>Play any game mode to make progress towards your challenges.</li>
            <li>When a challenge is completed, the ELO reward is instantly added to your rating.</li>
            <li>Check back here to see your progress!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DailyChallenges;