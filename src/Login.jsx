import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [storedUsername, setStoredUsername] = useState('');

  useEffect(() => {
    // Check if there's already a logged-in user
    const saved = localStorage.getItem('username');
    if (saved) {
      setStoredUsername(saved);
    }
  }, []);

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

  const handleContinueAsStored = () => {
    navigate('/menu');
  };

  const handleLogout = () => {
    setStoredUsername('');
    setUsername('');
  };

  // If already logged in, show quick continue option
  if (storedUsername && !username) {
    return (
      <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold mb-8">Galactic Typer</h1>
        <div className="bg-gray-800/50 backdrop-blur border border-cyan-500/30 rounded-lg p-8 w-full max-w-sm">
          <h2 className="text-3xl font-bold mb-6 text-center">Welcome Back</h2>
          <p className="text-xl text-center mb-6 text-cyan-300">{storedUsername}</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleContinueAsStored}
              className="bg-green-500 hover:bg-green-400 text-white font-bold text-xl w-full py-3 rounded-lg transition-all">
              Continue
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xl w-full py-3 rounded-lg transition-all">
              Switch Account
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">💡 Tip: Open in Incognito/Private mode to login with a different account</p>
        </div>
      </div>
    );
  }

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
        <p className="text-xs text-gray-400 text-center mt-6">💡 Tip: Open in Incognito/Private mode to play against yourself</p>
      </div>
    </div>
  );
};

export default Login;