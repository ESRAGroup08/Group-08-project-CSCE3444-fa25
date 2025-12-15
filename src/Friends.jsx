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
    try {
      const username = getCurrentUsername();
      const response = await fetch('/api/friends', {
        headers: { 'x-username': username }
      });
      if (!response.ok) throw new Error('Failed to fetch friend data.');
      
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
        const response = await fetch(`/api/users/search?query=${searchQuery}`, {
            headers: { 'x-username': getCurrentUsername() }
        });
        if (!response.ok) throw new Error('Search failed.');
        
        const users = await response.json();
        const currentUser = getCurrentUsername();
        const sentOrReceivedIds = new Set([
            ...sentRequests.map(r => r._id), 
            ...receivedRequests.map(r => r._id),
            ...friends.map(f => f._id)
        ]);
        
        setSearchResults(users.filter(user => 
            user.username !== currentUser && !sentOrReceivedIds.has(user._id)
        ));
    } catch (err) {
        setError(err.message);
    }
  };

  const handleRequestAction = async (action, userId, username) => {
    setError('');
    setSuccess('');
    try {
        let url, body, method = 'POST';

        if (action === 'request') {
            url = '/api/friend-request';
            body = { recipientId: userId };
        } else if (action === 'accept' || action === 'reject') {
            url = '/api/friend-request/respond';
            body = { requesterId: userId, action };
        } else if (action === 'unfriend' || action === 'cancel') {
            url = '/api/friend/remove';
            body = { friendId: userId };
        } else {
            return;
        }

        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'x-username': getCurrentUsername()
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setSuccess(data.message);
        fetchFriendData(); // Re-fetch all data to ensure UI is in sync
        setSearchResults([]); // Clear search results after an action
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
              {actionType === 'request' && <button onClick={() => handleRequestAction('request', user._id, user.username)} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">Send Request</button>}
              {actionType === 'accept' && (
                <div className="space-x-2">
                  <button onClick={() => handleRequestAction('accept', user._id, user.username)} className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded">Accept</button>
                  <button onClick={() => handleRequestAction('reject', user._id, user.username)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded">Reject</button>
                </div>
              )}
              {actionType === 'friend' && <button onClick={() => handleRequestAction('unfriend', user._id, user.username)} className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded">Unfriend</button>}
              {actionType === 'sent' && <button onClick={() => handleRequestAction('cancel', user._id, user.username)} className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded">Cancel</button>}
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
              <ul className="space-y-2">
                {friends
                  .filter(friend => 
                    friend.username.toLowerCase().includes(friendSearchQuery.toLowerCase())
                  )
                  .map(friend => (
                    <li key={friend._id} className="flex justify-between items-center bg-gray-700 p-3 rounded hover:bg-gray-600 transition">
                      <span className="font-medium">{friend.username}</span>
                      <button 
                        onClick={() => handleRequestAction('unfriend', friend._id, friend.username)} 
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                      >
                        Unfriend
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;