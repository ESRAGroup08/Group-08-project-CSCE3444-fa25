import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentUsername = () => localStorage.getItem('username') || '';

  const fetchFriendData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const username = getCurrentUsername();
      if (!username) throw new Error("You must be logged in.");

      const response = await fetch('/api/friends', {
        headers: { 'x-username': username }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        // Check for the HTML error
        if (errorData.startsWith('<!DOCTYPE html')) {
            throw new Error("API endpoint not found. Server may be misconfigured.");
        }
        const jsonData = JSON.parse(errorData);
        throw new Error(jsonData.message || 'Failed to fetch friend data.');
      }
      
      const data = await response.json();
      setFriends(data.friends || []);
      setSentRequests(data.sentRequests || []);
      setReceivedRequests(data.receivedRequests || []);
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
    setError('');
    setSuccess('');
    
    try {
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
            headers: { 'x-username': getCurrentUsername() }
        });
        if (!response.ok) throw new Error('Search failed.');
        
        const users = await response.json();
        const existingIds = new Set([
            ...friends.map(f => f._id),
            ...sentRequests.map(r => r._id),
            ...receivedRequests.map(r => r._id)
        ]);
        
        setSearchResults(users.filter(user => !existingIds.has(user._id)));

    } catch (err) {
        setError(err.message);
    }
  };

  const handleRequestAction = async (action, userId) => {
    setError('');
    setSuccess('');
    let url = '';
    let body = {};

    if (action === 'request') {
        url = '/api/friend-request/send';
        body = { recipientId: userId };
    } else if (action === 'accept' || action === 'reject') {
        url = '/api/friend-request/respond';
        body = { requesterId: userId, action };
    } else if (action === 'unfriend' || action === 'cancel') {
        url = '/api/friend/remove';
        body = { otherUserId: userId };
    } else {
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-username': getCurrentUsername()
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setSuccess(data.message);
        setTimeout(() => setSuccess(''), 3000);
        
        // Refresh all data and clear search
        fetchFriendData(); 
        setSearchQuery('');
        setSearchResults([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderUserList = (title, users, actionType) => (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {users.length === 0 ? <p className="text-gray-400">None</p> : (
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
              {actionType === 'friend' && <button onClick={() => handleRequestAction('unfriend', user._id)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded">Unfriend</button>}
              {actionType === 'sent' && <button onClick={() => handleRequestAction('cancel', user._id)} className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded">Cancel</button>}
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Friends</h1>
          <Link to="/menu" className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition">
            ← Back to Menu
          </Link>
        </div>
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

        {receivedRequests.length > 0 && (
          <div className="mb-6">
            {renderUserList('📬 Friend Requests', receivedRequests, 'accept')}
          </div>
        )}

        {sentRequests.length > 0 && (
          <div className="mb-6">
            {renderUserList('📤 Sent Requests', sentRequests, 'sent')}
          </div>
        )}

        <div className="mb-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">👥 My Friends ({friends.length})</h2>
            </div>
            <input
              type="text"
              value={friendSearchQuery}
              onChange={(e) => setFriendSearchQuery(e.target.value)}
              placeholder="Search your friends..."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
            />
            {friends.length === 0 ? (
              <p className="text-gray-400">No friends yet. Search and add some!</p>
            ) : (
              renderUserList(
                  'Your Friends', 
                  friends.filter(friend => 
                      friend.username.toLowerCase().includes(friendSearchQuery.toLowerCase())
                  ), 
                  'friend'
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;