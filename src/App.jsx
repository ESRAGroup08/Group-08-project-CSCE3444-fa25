import React from 'react';
import { Outlet } from 'react-router-dom';
import io from 'socket.io-client';

// The URL of your backend server
const SERVER_URL = 'http://localhost:3000';

console.log('--- App.jsx is loading ---');
console.log('Attempting to connect to WebSocket server at:', SERVER_URL);

const socket = io(SERVER_URL);

socket.on('connect', () => {
  // This log MUST appear in the browser console if connection is successful
  console.log('✅ SUCCESS: Connected to WebSocket server. Socket ID:', socket.id);
});

socket.on('connect_error', (err) => {
  // This log WILL appear in the browser console if connection fails
  console.error('❌ FAILED to connect to WebSocket server:', err.message);
  console.error('Full error object:', err);
});

function App() {
  return (
    <div className="App">
      <Outlet context={{ socket }} />
    </div>
  );
}

export default App;