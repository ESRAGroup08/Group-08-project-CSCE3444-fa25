import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUsername = localStorage.getItem('username');
      if (!storedUsername) {
        setError('No user is logged in.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${storedUsername}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data.');
        }
        const data = await response.json();
        setUserData(data);
        setNewUsername(data.username);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const storedUsername = localStorage.getItem('username');
    if (newUsername === storedUsername) {
      return setError('The new username must be different from the current one.');
    }

    try {
      const response = await fetch(`/api/users/${storedUsername}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update username.');
      }
      
      setSuccess('Username updated successfully!');
      setUserData(data);
      // Update username in localStorage to reflect the change
      localStorage.setItem('username', data.username);

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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">{userData?.username}'s Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-xl font-semibold">{userData?.gamesPlayed ?? 0}</p>
            <p className="text-gray-400">Games Played</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-xl font-semibold">{userData?.averageWPM?.toFixed(2) ?? 0}</p>
            <p className="text-gray-400">Average WPM</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-xl font-semibold">{userData?.averageAccuracy?.toFixed(2) ?? 0}%</p>
            <p className="text-gray-400">Average Accuracy</p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
          <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
          <form onSubmit={handleUsernameChange}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Change Username</label>
              <input
                type="text"
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
            >
              Save Changes
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          {/* --- THIS IS THE FIX --- */}
          <Link to="/menu" className="text-blue-400 hover:underline">Back to Main Menu</Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;