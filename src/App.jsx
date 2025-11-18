import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

/**
 * Example MainMenu component. Adapt to your project's structure.
 * - Uses the socket from Outlet context (App passes it)
 * - Disables the Casual button until username is set in localStorage and socket is connected
 * - Shows user-facing hints when disabled
 */
export default function MainMenu() {
  const { socket } = useOutletContext(); // expects App to pass { socket } via Outlet
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [connected, setConnected] = useState(socket ? socket.connected : false);

  useEffect(() => {
    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }

    if (!socket) return;

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // In case username is set after mount (e.g., from Login), watch localStorage
    function onStorage(e) {
      if (e.key === 'username') {
        setUsername(e.newValue);
      }
    }
    window.addEventListener('storage', onStorage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      window.removeEventListener('storage', onStorage);
    };
  }, [socket]);

  function handleCasual() {
    if (!socket || !socket.connected) {
      console.warn('Casual: socket not connected');
      return;
    }
    if (!username) {
      console.warn('Casual: username not set');
      return;
    }
    console.log('CLIENT: Emitting "casual:enqueue" to the server');
    socket.emit('casual:enqueue');
  }

  return (
    <div className="main-menu">
      <h2>Main Menu</h2>
      <div>
        <button
          disabled={!username || !connected}
          onClick={handleCasual}
        >
          Casual
        </button>
      </div>

      {!username && <div className="hint">Please log in to play (set a username).</div>}
      {username && !connected && <div className="hint">Connecting to server…</div>}
    </div>
  );
}