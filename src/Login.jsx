import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // New state to toggle between Login and Register

  const handleAuth = (e) => { // Renamed from handleLogin to be more generic
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    // Since authentication is dummy, any username/password works for both login and register
    localStorage.setItem('username', username.trim());
    console.log(`User ${isRegistering ? 'registered' : 'logged in'} as: ${username.trim()}`);
    navigate('/menu');
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">Galactic Typer</h1>
      <div className="bg-gray-800/50 backdrop-blur border border-cyan-500/30 rounded-lg p-8 w-full max-w-sm">
        {/* Toggle buttons for Login/Register */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setIsRegistering(false)}
            className={`px-6 py-2 rounded-l-lg font-bold transition-all ${!isRegistering ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsRegistering(true)}
            className={`px-6 py-2 rounded-r-lg font-bold transition-all ${isRegistering ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            Register
          </button>
        </div>

        <h2 className="text-3xl font-bold mb-6 text-center">{isRegistering ? 'Register Account' : 'Login to Account'}</h2>
        <form onSubmit={handleAuth}>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter your username"
              aria-label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <input
              type="password"
              placeholder="Enter any password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl w-full py-3 rounded-lg mt-4 transition-all"
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-400 text-center mt-6">💡 Tip: Any username and password will work for demonstration.</p>
      </div>
    </div>
  );
};

export default Login;