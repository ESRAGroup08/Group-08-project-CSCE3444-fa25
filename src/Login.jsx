import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // New state to toggle between Login and Register

  const handleAuth = async (e) => { // Renamed from handleLogin to be more generic
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isRegistering ? '/api/register' : '/api/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.user.username);
      navigate('/menu');
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Star field for login too since we hide the animated one */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
      </div>
      
      <h1 className="text-7xl font-black mb-12 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-500 z-10">GALACTIC TYPER</h1>
      
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 w-full max-w-md z-10 shadow-2xl">
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
          <button
            onClick={() => setIsRegistering(false)}
            className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest transition-all ${!isRegistering ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsRegistering(true)}
            className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest transition-all ${isRegistering ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:text-white'}`}
          >
            Join
          </button>
        </div>

        <h2 className="text-xs font-black mb-8 text-center uppercase tracking-[0.4em] text-cyan-400/80">{isRegistering ? 'Initialize New Pilot' : 'Auth Protocol Required'}</h2>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="text"
                placeholder="PILOT NAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold placeholder:text-white/20"
                required
              />
            </div>
            <div className="relative group">
              <input
                type="password"
                placeholder="ACCESS CODE"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold placeholder:text-white/20"
                required
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl text-center">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xl py-5 rounded-xl transition-all shadow-xl hover:shadow-cyan-500/25 hover:-translate-y-1 uppercase tracking-widest mt-4"
            >
              {isSubmitting ? 'Processing...' : (isRegistering ? 'Create Profile' : 'Engage')}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest text-center mt-10">
          Terminal Status: Ready for Input
        </p>
      </div>
    </div>
  );
};

export default Login;
