import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    // Store the username in localStorage
    localStorage.setItem('username', username.trim());
    console.log(`Logged in as: ${username.trim()}`);
    navigate('/menu');
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">Galactic Typer</h1>
      <div className="bg-gray-800/50 backdrop-blur border border-cyan-500/30 rounded-lg p-8 w-full max-w-sm">
        <h2 className="text-3xl font-bold mb-6 text-center">Enter Your Name</h2>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Enter your username" 
              aria-label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl w-full py-3 rounded-lg mt-4 transition-all">
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;