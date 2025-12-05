import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  // --- ORIGINAL LOGIN CODE RESTORED ---
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if the user is already logged in from a previous session
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        if (data.loggedIn) {
          // If logged in, store username and redirect to the menu
          localStorage.setItem('username', data.user.username);
          navigate('/menu');
        }
      } catch (err) {
        console.error("Could not check auth status on page load", err);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to log in.');
      }

      // On successful login, save the username in localStorage for other components to use
      localStorage.setItem('username', data.username);
      // Navigate to the main menu
      navigate("/menu");

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">Galactic Typer</h1>
      <div className="bg-gray-800/50 backdrop-blur border border-cyan-500/30 rounded-lg p-8 w-full max-w-sm">
        <h2 className="text-3xl font-bold mb-6 text-center">Login or Sign Up</h2>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Enter your username" 
              aria-label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl w-full py-3 rounded-lg mt-4">
              Continue
            </button>
          </div>
        </form>
        {/* The Google Sign-in has been removed as requested to simplify the form */}
      </div>
    </div>
  );
};

export default Login;