import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // For a nice loading spinner

const DailyChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const fetchChallenges = async () => {
      setIsLoading(true);
      setError('');
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/challenges', {
          headers: { 'x-auth-token': authToken || '' },
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error('Failed to load challenges. Please try again.');
        }
        const data = await response.json();
        setChallenges(data.dailyChallenges || []);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check your connection or try again later.');
        } else {
          setError(err.message);
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    fetchChallenges();
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const getDifficultyColor = (reward) => {
    if (reward >= 50) return 'bg-purple-600';
    if (reward >= 30) return 'bg-red-600';
    if (reward >= 20) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-8">
      <div className="w-full max-w-6xl mx-auto bg-black/40 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">Daily Challenges</h1>
            <p className="text-cyan-300/60 font-bold uppercase tracking-widest text-xs mt-2">Complete tasks to boost your rating</p>
          </div>
          <Link to="/menu" className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl text-white transition-all border border-white/10 hover:border-white/20 uppercase font-bold tracking-widest text-sm">
            ← Menu
          </Link>
        </div>

        {error && <div className="bg-red-600/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 text-center font-bold">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {challenges.map(challenge => (
            <div
              key={challenge.challengeId}
              className={`backdrop-blur-sm border-2 rounded-2xl p-6 transition-all duration-300 group ${
                challenge.completed
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:border-cyan-500/50 hover:bg-white/10 hover:-translate-y-1'
              }`}
            >
              <h3 className="text-lg font-bold mb-4 leading-tight group-hover:text-cyan-300 transition-colors">{challenge.description}</h3>
              
              <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs mb-6 font-black tracking-widest uppercase">
                <span className="text-white/40">{challenge.progress} / {challenge.target}</span>
                {challenge.completed && <span className="text-emerald-400">Done</span>}
              </div>
              
              <div className="flex justify-center">
                  <span className={`${getDifficultyColor(challenge.reward)} px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-lg`}>
                    +{challenge.reward} ELO REWARD
                  </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
          <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-white/80">💡 Intelligence Briefing</h3>
          <ul className="space-y-4 text-white/60 text-sm font-medium">
            <li className="flex gap-3"><span className="text-cyan-400 font-bold">»</span> Daily challenges recalibrate every 24 hours.</li>
            <li className="flex gap-3"><span className="text-cyan-400 font-bold">»</span> Any active mission contributes to your progress.</li>
            <li className="flex gap-3"><span className="text-cyan-400 font-bold">»</span> Rewards are immediate upon mission completion.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DailyChallenges;
