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

  const getAuthToken = () => localStorage.getItem('authToken') || '';
  const getCurrentUsername = () => localStorage.getItem('username') || '';

  const fetchFriendData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const username = getCurrentUsername();
      if (!username) throw new Error("You must be logged in.");

      const response = await fetch('/api/friends', {
        headers: { 'x-auth-token': getAuthToken() },
        signal: controller.signal
      });
      
      if (!response.ok) {
        const errorData = await response.text();
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
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection or try again later.');
      } else {
        setError(err.message);
      }
    } finally {
      clearTimeout(timeoutId);
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
            headers: { 'x-auth-token': getAuthToken() }
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
                'x-auth-token': getAuthToken()
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
    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
      {title && <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">{title}</h3>}
      {users.length === 0 ? <p className="text-white/20 italic text-sm">Empty list</p> : (
        <ul className="space-y-3">
          {users.map(user => (
            <li key={user._id} className="flex justify-between items-center bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-colors group">
              <span className="font-bold tracking-wide group-hover:text-cyan-400 transition-colors">{user.username}</span>
              <div className="flex gap-2">
                {actionType === 'request' && <button onClick={() => handleRequestAction('request', user._id)} className="bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-cyan-500/30">Add</button>}
                {actionType === 'accept' && (
                  <>
                    <button onClick={() => handleRequestAction('accept', user._id)} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-emerald-500/30">Accept</button>
                    <button onClick={() => handleRequestAction('reject', user._id)} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-red-500/30">Reject</button>
                  </>
                )}
                {actionType === 'friend' && <button onClick={() => handleRequestAction('unfriend', user._id)} className="bg-white/5 hover:bg-red-600/20 hover:text-red-400 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-white/10 hover:border-red-500/30 opacity-40 hover:opacity-100">Remove</button>}
                {actionType === 'sent' && <button onClick={() => handleRequestAction('cancel', user._id)} className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-white/10 opacity-60">Cancel</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (isLoading) return <div className="text-center text-white">Loading friends...</div>;

  return (
    <div className="min-h-screen bg-transparent text-white p-8">
      <div className="w-full max-w-4xl mx-auto bg-black/40 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">Friends</h1>
          <Link to="/menu" className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl text-white transition-all border border-white/10 hover:border-white/20 uppercase font-bold tracking-widest text-sm">
            ← Menu
          </Link>
        </div>
        {error && <p className="text-red-400 text-sm font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20 mb-6 text-center">{error}</p>}
        {success && <p className="text-emerald-400 text-sm font-bold bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20 mb-6 text-center">{success}</p>}

        <div className="bg-white/5 p-8 rounded-2xl border border-white/5 mb-8">
          <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-white/80">Find New Friends</h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username"
              className="flex-grow p-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-bold"
            />
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-cyan-500/25">Search</button>
          </form>
          {searchResults.length > 0 && (
            <div className="mt-8 border-t border-white/5 pt-8">
              {renderUserList('Search Results', searchResults, 'request')}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            {receivedRequests.length > 0 && (
              <div className="animate-in slide-in-from-left duration-500">
                {renderUserList('📬 Requests', receivedRequests, 'accept')}
              </div>
            )}

            {sentRequests.length > 0 && (
              <div className="opacity-80">
                {renderUserList('📤 Sent', sentRequests, 'sent')}
              </div>
            )}
          </div>

          <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-white/80">👥 My Friends ({friends.length})</h2>
            </div>
            <input
              type="text"
              value={friendSearchQuery}
              onChange={(e) => setFriendSearchQuery(e.target.value)}
              placeholder="Filter friends..."
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-6 font-bold text-sm"
            />
            {friends.length === 0 ? (
              <p className="text-white/30 italic text-center py-8">No friends yet. Search and add some!</p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {renderUserList(
                    '', 
                    friends.filter(friend => 
                        friend.username.toLowerCase().includes(friendSearchQuery.toLowerCase())
                    ), 
                    'friend'
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;
