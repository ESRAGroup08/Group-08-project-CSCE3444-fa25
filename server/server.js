
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(cors());

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

let rooms = {}; // In-memory store for rooms
let lobbyUsers = []; // In-memory store for users in the lobby
let casualWaitingPlayer = null;
let rankedWaitingPlayer = null;

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Send the current list of rooms to the new user
  socket.emit('lobby_list', Object.values(rooms).map(r => ({ roomId: r.roomId, players: r.players })));

  // Send the current list of users in the lobby to the new user
  socket.emit('update_user_list', lobbyUsers.map(u => u.username));

  socket.on('join_lobby', (username) => {
    if (!lobbyUsers.some(user => user.id === socket.id)) {
      lobbyUsers.push({ username, id: socket.id });
      io.emit('update_user_list', lobbyUsers.map(u => u.username));
    }
  });

  socket.on('join_casual', () => {
    if (!casualWaitingPlayer) {
      casualWaitingPlayer = socket;
      socket.emit('waiting_for_opponent');
    } else {
      const roomId = `room_${socket.id}_${casualWaitingPlayer.id}`;
      socket.emit("match_found", { roomId: roomId });
      casualWaitingPlayer.emit("match_found", { roomId: roomId });
      casualWaitingPlayer = null;
    }
  });

  socket.on("join_ranked", () => {
    if (!rankedWaitingPlayer) {
      rankedWaitingPlayer = socket;
      socket.emit('waiting_for_opponent');
    } else {
      const roomId = `room_${socket.id}_${rankedWaitingPlayer.id}`;
      socket.emit("match_found", { roomId: roomId });
      rankedWaitingPlayer.emit("match_found", { roomId: roomId });
      rankedWaitingPlayer = null;
    }
  });

  socket.on('lobby_list_request', () => {
    socket.emit('lobby_list', Object.values(rooms).map(r => ({ roomId: r.roomId, players: r.players })));
  });

  socket.on('create_room', ({ host }, callback) => {
    const roomId = `room-${Object.keys(rooms).length + 1}`;
    const player = { username: host, ready: false, id: socket.id };
    rooms[roomId] = {
      roomId,
      players: [player],
      host: player,
    };
    socket.join(roomId);
    console.log(`Room ${roomId} created by ${host}`);
    callback({ roomId, players: rooms[roomId].players });
    io.emit('lobby_list', Object.values(rooms).map(r => ({ roomId: r.roomId, players: r.players })));
  });

  socket.on('join_room', ({ roomId, username }, callback) => {
    if (rooms[roomId]) {
      const player = { username, ready: false, id: socket.id };
      rooms[roomId].players.push(player);
      socket.join(roomId);
      console.log(`${username} joined room ${roomId}`);
      callback({ roomId, players: rooms[roomId].players });
      io.to(roomId).emit('room_update', { roomId, players: rooms[roomId].players });
      io.emit('lobby_list', Object.values(rooms).map(r => ({ roomId: r.roomId, players: r.players })));
    } else {
      // Handle error: room not found
    }
  });

  socket.on('leave_room', ({ roomId, username }) => {
    if (rooms[roomId]) {
      rooms[roomId].players = rooms[roomId].players.filter(p => p.username !== username);
      socket.leave(roomId);
      console.log(`${username} left room ${roomId}`);
      io.to(roomId).emit('room_update', { roomId, players: rooms[roomId].players });
      io.emit('lobby_list', Object.values(rooms).map(r => ({ roomId: r.roomId, players: r.players })));
    }
  });

  socket.on('set_ready', ({ roomId, username, ready }) => {
    if (rooms[roomId]) {
      const player = rooms[roomId].players.find(p => p.username === username);
      if (player) {
        player.ready = ready;
        console.log(`${username} in room ${roomId} is ${ready ? 'ready' : 'not ready'}`);
        io.to(roomId).emit('room_update', { roomId, players: rooms[roomId].players });
      }
    }
  });

  socket.on('start_game', ({ roomId }) => {
    if (rooms[roomId]) {
      const allReady = rooms[roomId].players.every(p => p.ready);
      if (allReady) {
        console.log(`Starting game in room ${roomId}`);
        // For now, just sending a simple message. You can expand this with game-specific data.
        io.to(roomId).emit('start_game', { roomId, payload: { message: 'Game starting!' } });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);

    if (casualWaitingPlayer === socket) {
      casualWaitingPlayer = null;
    }
    if (rankedWaitingPlayer === socket) {
      rankedWaitingPlayer = null;
    }

    // Find which room the user was in and remove them
    for (const roomId in rooms) {
      const playerIndex = rooms[roomId].players.findIndex(p => p.id === socket.id);
      if (playerIndex > -1) {
        const player = rooms[roomId].players[playerIndex];
        rooms[roomId].players.splice(playerIndex, 1);
        io.to(roomId).emit('room_update', { roomId, players: rooms[roomId].players });
        io.emit('lobby_list', Object.values(rooms).map(r => ({ roomId: r.roomId, players: r.players })));
        console.log(`${player.username} disconnected from room ${roomId}`);
        break;
      }
    }

    // Remove user from lobby
    const userIndex = lobbyUsers.findIndex(user => user.id === socket.id);
    if (userIndex > -1) {
      lobbyUsers.splice(userIndex, 1);
      io.emit('update_user_list', lobbyUsers.map(u => u.username));
    }
  });
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
