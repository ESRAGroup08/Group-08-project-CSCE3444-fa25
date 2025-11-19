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

  // Get current user from localStorage
  const getCurrentUsername = () => localStorage.getItem('username') || '';

  // Initialize with mock data from localStorage
  const initializeMockFriends = useCallback(() => {
    const username = getCurrentUsername();
    const mockFriendsKey = `friends_${username}`;
    const storedFriends = localStorage.getItem(mockFriendsKey);
    
    if (storedFriends) {
      const data = JSON.parse(storedFriends);
      setFriends(data.friends || []);
      setSentRequests(data.sentRequests || []);
      setReceivedRequests(data.receivedRequests || []);
    } else {
      setFriends([]);
      setSentRequests([]);
      setReceivedRequests([]);
    }
    setIsLoading(false);
  }, []);

  const saveFriendsToStorage = useCallback((friendsData, sentData, receivedData) => {
    const username = getCurrentUsername();
    const mockFriendsKey = `friends_${username}`;
    localStorage.setItem(mockFriendsKey, JSON.stringify({
      friends: friendsData,
      sentRequests: sentData,
      receivedRequests: receivedData
    }));
  }, []);

  const fetchFriendData = useCallback(async () => {
    // Try API first, fallback to localStorage
    try {
      const username = getCurrentUsername();
      const response = await fetch('/api/friends', {
        headers: { 'x-username': username }
      });
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
        setSentRequests(data.sentRequests || []);
        setReceivedRequests(data.receivedRequests || []);
        saveFriendsToStorage(data.friends || [], data.sentRequests || [], data.receivedRequests || []);
      } else {
        initializeMockFriends();
      }
    } catch (err) {
      initializeMockFriends();
    } finally {
      setIsLoading(false);
    }
  }, [initializeMockFriends, saveFriendsToStorage]);

  useEffect(() => {
    fetchFriendData();
  }, [fetchFriendData]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setError('');
    
    // Mock search: create users based on search query
    const mockUsers = [];
    for (let i = 1; i <= 20; i++) {
      const username = `test${i}`;
      if (username.includes(searchQuery.toLowerCase())) {
        mockUsers.push({
          _id: `mock_${i}`,
          username: username
        });
      }
    }
    
    if (mockUsers.length === 0) {
      // Generate based on search query
      mockUsers.push({
        _id: `mock_search_${searchQuery}`,
        username: searchQuery
      });
    }
    
    setSearchResults(mockUsers);
  };

  const handleRequestAction = async (action, userId, username) => {
    try {
      const newFriends = [...friends];
      const newSentRequests = [...sentRequests];
      const newReceivedRequests = [...receivedRequests];

      if (action === 'request') {
        // Add to sent requests
        if (!newSentRequests.find(r => r._id === userId)) {
          newSentRequests.push({ _id: userId, username });
        }
        setSearchResults(searchResults.filter(r => r._id !== userId));
      } else if (action === 'accept') {
        // Move from received to friends
        newFriends.push({ _id: userId, username });
        const index = newReceivedRequests.findIndex(r => r._id === userId);
        if (index > -1) newReceivedRequests.splice(index, 1);
      } else if (action === 'reject') {
        // Remove from received requests or sent requests
        const recIndex = newReceivedRequests.findIndex(r => r._id === userId);
        const sentIndex = newSentRequests.findIndex(r => r._id === userId);
        const friendIndex = newFriends.findIndex(r => r._id === userId);
        
        if (recIndex > -1) newReceivedRequests.splice(recIndex, 1);
        if (sentIndex > -1) newSentRequests.splice(sentIndex, 1);
        if (friendIndex > -1) newFriends.splice(friendIndex, 1);
      }

      setFriends(newFriends);
      setSentRequests(newSentRequests);
      setReceivedRequests(newReceivedRequests);
      saveFriendsToStorage(newFriends, newSentRequests, newReceivedRequests);
      
      setSuccess(`Action completed!`);
      setTimeout(() => setSuccess(''), 3000);
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
              {actionType === 'friend' && <button onClick={() => handleRequestAction('reject', user._id, user.username)} className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded">Unfriend</button>}
              {actionType === 'sent' && <button onClick={() => handleRequestAction('reject', user._id, user.username)} className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded">Cancel</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (isLoading) return <div className="text-center text-white">Loading friends...</div>;

  const handleAddTestFriends = async () => {
    try {
      // Create 10 test friends locally
      const testFriends = [];
      for (let i = 1; i <= 10; i++) {
        testFriends.push({
          _id: `test${i}`,
          username: `test${i}`
        });
      }
      
      setFriends(testFriends);
      saveFriendsToStorage(testFriends, sentRequests, receivedRequests);
      setSuccess('✓ Added 10 test friends (test1-test10)!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to add test friends: ${err.message}`);
    }
  };

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

        <div className="mb-4 text-center">
          <button 
            onClick={handleAddTestFriends}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm"
          >
            ➕ Add 10 Test Friends (test1-test10)
          </button>
        </div>

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

        {/* Friend Requests Section */}
        {receivedRequests.length > 0 && (
          <div className="mb-6">
            {renderUserList('📬 Friend Requests', receivedRequests, 'accept')}
          </div>
        )}

        {/* Sent Requests Section */}
        {sentRequests.length > 0 && (
          <div className="mb-6">
            {renderUserList('📤 Sent Requests', sentRequests, 'sent')}
          </div>
        )}

        {/* My Friends Section with Search */}
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
                        onClick={() => handleRequestAction('reject', friend._id, friend.username)} 
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
