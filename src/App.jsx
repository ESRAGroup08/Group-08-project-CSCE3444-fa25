import React from 'react';
import { Outlet } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('/');

function App() {
  return (
    <div className="App">
      <Outlet context={{ socket }} />
      
    </div>
  );
}

export default App;