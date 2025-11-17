import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriendData = useCallback(async () => {
    try {
      const response = await fetch('/api/friends');
      if (!response.ok) throw new Error('Failed to fetch friend data.');
      const data = await response.json();
      setFriends(data.friends);
      setSentRequests(data.sentRequests);
      setReceivedRequests(data.receivedRequests);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriendData();
  }, [fetchFriendData]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const response = await fetch(`/api/friends/search?query=${searchQuery}`);
      if (!response.ok) throw new Error('Search failed.');
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRequestAction = async (action, userId) => {
    try {
      const response = await fetch(`/api/friends/${action}/${userId}`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSuccess(data.message);
      fetchFriendData(); // Refresh data
      setSearchResults([]); // Clear search results
    } catch (err) {
      setError(err.message);
    }
  };

  const renderUserList = (title, users, actionType) => (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {users.length === 0 ? <p className="text-gray-400">No users found.</p> : (
        <ul className="space-y-2">
          {users.map(user => (
            <li key={user._id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
              <span>{user.username}</span>
              {actionType === 'request' && <button onClick={() => handleRequestAction('request', user._id)} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">Send Request</button>}
              {actionType === 'accept' && (
                <div className="space-x-2">
                  <button onClick={() => handleRequestAction('accept', user._id)} className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded">Accept</button>
                  <button onClick={() => handleRequestAction('reject', user._id)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded">Reject</button>
                </div>
              )}
              {actionType === 'friend' && <button onClick={() => handleRequestAction('reject', user._id)} className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded">Unfriend</button>}
              {actionType === 'sent' && <button onClick={() => handleRequestAction('reject', user._id)} className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded">Cancel</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (isLoading) return <div className="text-center text-white">Loading friends...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">Friends</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">Find New Friends</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username"
              className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-md">Search</button>
          </form>
          {searchResults.length > 0 && (
            <div className="mt-4">
              {renderUserList('Search Results', searchResults, 'request')}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderUserList('Friend Requests', receivedRequests, 'accept')}
          {renderUserList('My Friends', friends, 'friend')}
          {renderUserList('Sent Requests', sentRequests, 'sent')}
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/menu" className="text-cyan-400 hover:underline">Back to Main Menu</Link>
        </div>
      </div>
    </div>
  );
};

export default Friends;
