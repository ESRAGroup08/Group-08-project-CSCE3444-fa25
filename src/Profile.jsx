import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { username } = useParams();
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const fetchUserData = async () => {
      if (!username) {
        setError('No user profile specified.');
        setIsLoading(false);
        return;
      }

      try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`/api/users/${username}`, {
          headers: {
            'x-auth-token': authToken || ''
          },
          signal: controller.signal
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch user data.');
        }

        const data = await response.json();
        setUserData(data);
        setNewUsername(data.username);
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

    fetchUserData();
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [username]);

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const currentUsername = username;
    if (newUsername.trim() === '') {
        return setError('Username cannot be empty.');
    }
    if (newUsername.trim() === currentUsername) {
      return setError('The new username must be different from the current one.');
    }

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/${currentUsername}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': authToken || ''
        },
        body: JSON.stringify({ newUsername: newUsername.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update username.');
      }
      
      setSuccess('Username updated successfully!');
      localStorage.setItem('username', data.username);
      
      // Redirect to the new profile page using useNavigate
      navigate(`/profile/${data.username}`, { replace: true });

    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <div className="text-center text-white">Loading profile...</div>;
  }

  if (error && !userData) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <Link to="/" className="text-blue-400 hover:underline">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col items-center p-8">
      <div className="w-full max-w-2xl bg-black/40 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">{userData?.username}'s Profile</h1>
            <Link to="/menu" className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl text-white transition-all border border-white/10 hover:border-white/20 uppercase font-bold tracking-widest text-sm">
                ← Menu
            </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center group hover:bg-white/10 transition-colors">
            <p className="text-3xl font-black text-cyan-400 mb-1">{userData?.gamesPlayed ?? 0}</p>
            <p className="text-white/40 uppercase text-xs font-black tracking-widest">Games</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center group hover:bg-white/10 transition-colors">
            <p className="text-3xl font-black text-purple-400 mb-1">{userData?.averageWPM?.toFixed(1) ?? 0}</p>
            <p className="text-white/40 uppercase text-xs font-black tracking-widest">Avg WPM</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center group hover:bg-white/10 transition-colors">
            <p className="text-3xl font-black text-emerald-400 mb-1">{userData?.averageAccuracy?.toFixed(1) ?? 0}%</p>
            <p className="text-white/40 uppercase text-xs font-black tracking-widest">Accuracy</p>
          </div>
        </div>

        <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
          <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-white/80">Account Settings</h2>
          <form onSubmit={handleUsernameChange} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3 ml-1">Update Username</label>
              <input
                type="text"
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-lg font-bold"
              />
            </div>
            {error && <p className="text-red-400 text-sm font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}
            {success && <p className="text-emerald-400 text-sm font-bold bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20">{success}</p>}
            <button 
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 uppercase tracking-widest"
            >
              Update Identity
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
