import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Results = () => {
  const location = useLocation();
  const { elapsedTime, wpm, accuracy } = location.state || { elapsedTime: 0, wpm: 0, accuracy: 0 };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">Race Results</h1>
      <div className="bg-gray-800/50 backdrop-blur border border-cyan-500/30 rounded-lg p-8 text-center">
        <p className="text-2xl mb-4">Time: {elapsedTime.toFixed(2)}s</p>
        <p className="text-2xl mb-4">WPM: {wpm}</p>
        <p className="text-2xl mb-6">Accuracy: {accuracy}%</p>
        <Link to="/lobby" className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl px-12 py-3 rounded-lg mt-4">
          Back to Lobby
        </Link>
      </div>
    </div>
  );
};

export default Results;
