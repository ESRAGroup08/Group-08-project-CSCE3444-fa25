import './style.css';
import './index.css';
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import ThemeToggle from "./components/ThemeToggle.jsx"; // NEW: Theme toggle component

let socket; // single socket instance per module

export default function Lobby({ username, onEnterGame }) {
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState([]); // available rooms from server
  const [players, setPlayers] = useState([]);
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io(); // connects to same host by default; replace url if needed
    }

    socket.emit("lobby_list_request");

    socket.on("lobby_list", (list) => {
      setRooms(list);
    });

    socket.on("room_update", (payload) => {
      if (payload.roomId === joinedRoom) {
        setPlayers(payload.players);
      }
    });

    socket.on("joined_room", (payload) => {
      setJoinedRoom(payload.roomId);
      setPlayers(payload.players || []);
    });

    socket.on("player_left", (payload) => {
      if (payload.roomId === joinedRoom) setPlayers(payload.players || []);
    });

    socket.on("start_game", ({ roomId, payload }) => {
      if (roomId === joinedRoom) {
        onEnterGame({ roomId, init: payload });
      }
    });

    return () => {
      socket.off("lobby_list");
      socket.off("room_update");
      socket.off("joined_room");
      socket.off("player_left");
      socket.off("start_game");
    };
  }, [joinedRoom, onEnterGame]);

  function createRoom() {
    socket.emit("create_room", { host: username }, (response) => {
      if (response?.roomId) {
        setJoinedRoom(response.roomId);
        setPlayers(response.players || []);
      }
    });
  }

  function joinExistingRoom(rid) {
    socket.emit("join_room", { roomId: rid, username }, (response) => {
      if (response?.roomId) {
        setJoinedRoom(response.roomId);
        setPlayers(response.players || []);
      }
    });
  }

  function leaveRoom() {
    socket.emit("leave_room", { roomId: joinedRoom, username });
    setJoinedRoom(null);
    setPlayers([]);
    setIsReady(false);
  }

  function toggleReady() {
    const next = !isReady;
    setIsReady(next);
    socket.emit("set_ready", { roomId: joinedRoom, username, ready: next });
  }

  function startGame() {
    socket.emit("start_game", { roomId: joinedRoom });
  }

  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on("update_user_list", (userList) => {
        setUsers(userList);
      });
    }

    return () => {
      if (socket) {
        socket.off("update_user_list");
      }
    };
  }, []);

  const handleJoin = () => {
    socket.emit("join_lobby", username);
    setJoined(true);
  };

  return (
    <div className="lobby-container">
        <h2>Multiplayer Lobby</h2>
        {!joinedRoom ? (
          <>
            <div>
              <button onClick={createRoom}>Create Room</button>
            </div>
            <h3>Available Rooms</h3>
            <ul>
              {rooms.length === 0 && <li>No rooms yet</li>}
              {rooms.map((r) => (
                <li key={r.roomId}>
                  <strong>{r.roomId}</strong> — {r.players?.length || 0} players{" "}
                  <button onClick={() => joinExistingRoom(r.roomId)}>Join</button>
                </li>
              ))}
            </ul>
            <div>
              <h3>Users in Lobby</h3>
              <ul>
                {users.map((user) => (
                  <li key={user}>{user}</li>
                ))}
              </ul>
              <button onClick={handleJoin} disabled={joined}>
                Join Lobby
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Room: {joinedRoom}</h3>
            <ul>
              {players.map((p) => (
                <li key={p.username}>
                  {p.username} {p.ready ? "✅" : "⏳"}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 8 }}>
              <button onClick={toggleReady}>{isReady ? "Unready" : "Ready"}</button>
              <button onClick={leaveRoom} style={{ marginLeft: 8 }}>
                Leave
              </button>
              <button onClick={startGame} style={{ marginLeft: 8 }}>
                Start Game
              </button>
            </div>
          </>
        )}

        {/* NEW FEATURE 3: Theme Toggle */}
        <div style={{ marginTop: 12 }}>
          <ThemeToggle />
              </div>
            </div>
          );}