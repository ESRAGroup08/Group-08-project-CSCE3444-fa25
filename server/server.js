const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');

// --- Import your local game logic modules ---
const casualMatchmaking = require('./casualMatchmaking');
const privateLobby = require('./privateLobby');
const ranking = require('./ranking');
// ----------------------------------------------------

// --- Define allowed origins ---
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
];

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../dist')));

// Helper function to start a game for multiple players
function startGame(sockets, gameType, roomId) {
  const players = sockets.map(socket => ({
    username: socket.data.username,
    stats: socket.data.stats,
    socketId: socket.id
  }));

  sockets.forEach(socket => socket.join(roomId));

  console.log(`Starting ${gameType} match in room ${roomId} between players: ${players.map(p => p.username).join(', ')}`);
  io.to(roomId).emit('game:start', { roomId, players, gameType });
}

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}.`);

  socket.on('user:init', ({ username, stats }) => {
    socket.data.username = username;
    socket.data.stats = stats || {};
    ranking.ensurePlayer(username, stats);
    console.log(`User ${username} (${socket.id}) initialized.`);
  });
  
  // --- Casual Matchmaking Handlers ---
  socket.on('casual:enqueue', () => {
    if (!socket.data.username) {
      return socket.emit('error', { message: 'Username not set. Please initialize first.' });
    }
    console.log(`Player ${socket.data.username} is looking for a casual match.`);
    
    const skillScore = ranking.computeSkillScore(socket.data.stats);
    const result = casualMatchmaking.enqueue({
      socket,
      username: socket.data.username,
      stats: socket.data.stats,
      skillScore
    });

    if (result.matched) {
      const opponentSocket = result.opponent.socket;
      console.log(`Match found: ${result.self.username} vs ${result.opponent.username}`);
      const roomId = `game_casual_${result.self.id}_${result.opponent.id}`;
      startGame([socket, opponentSocket], 'casual', roomId);
    } else {
      socket.emit('casual:enqueued');
      console.log(`Player ${socket.data.username} added to the queue.`);
    }
  });

  // --- Private Lobby Handlers ---
  socket.on('lobby:create', () => {
    if (!socket.data.username) {
      return socket.emit('error', { message: 'Cannot create lobby: User not initialized.' });
    }
    try {
      const { roomId, roomState } = privateLobby.createRoom({
        hostUsername: socket.data.username,
        socket: socket,
        stats: socket.data.stats,
      });
      socket.join(roomId);
      console.log(`User ${socket.data.username} created and joined lobby ${roomId}`);
      socket.emit('lobby:state', { roomId, ...roomState });
    } catch (error) {
      socket.emit('error', { message: `Error creating lobby: ${error.message}` });
    }
  });

  socket.on('lobby:join', ({ roomId }) => {
    if (!socket.data.username) {
      return socket.emit('error', { message: 'Cannot join lobby: User not initialized.' });
    }
    try {
      const { roomState } = privateLobby.joinRoom({
        roomId,
        username: socket.data.username,
        socket: socket,
        stats: socket.data.stats,
      });
      socket.join(roomId);
      console.log(`User ${socket.data.username} joined lobby ${roomId}`);
      io.to(roomId).emit('lobby:state', { roomId, ...roomState });
    } catch (error) {
      socket.emit('error', { message: `Error joining lobby: ${error.message}` });
    }
  });

  socket.on('lobby:setReady', ({ roomId, ready }) => {
    if (!socket.data.username) {
      return socket.emit('error', { message: 'Cannot set ready status: User not initialized.' });
    }
    try {
      const { roomState } = privateLobby.setReady(roomId, socket.data.username, ready);
      io.to(roomId).emit('lobby:state', { roomId, ...roomState });

      if (roomState.players.length > 1 && privateLobby.allReady(roomId)) {
        console.log(`All players in lobby ${roomId} are ready. Starting game.`);
        const room = privateLobby.getRoomState(roomId);
        const roomSockets = Array.from(privateLobby._rooms.get(roomId).players.values()).map(p => p.socket);
        startGame(roomSockets, 'custom', roomId);
      }
    } catch (error) {
      socket.emit('error', { message: `Error setting ready status: ${error.message}` });
    }
  });
    
  socket.on('lobby:leave', ({ roomId }) => {
    try {
        const username = socket.data.username;
        const result = privateLobby.leaveRoom(roomId, username);
        socket.leave(roomId);
        console.log(`User ${username} left lobby ${roomId}`);
        if (result) {
            io.to(roomId).emit('lobby:state', { roomId, ...result.roomState });
        }
    } catch (error) {
        console.error(`Error leaving lobby ${roomId}: ${error.message}`);
    }
  });

  // --- General Game and Disconnect Handlers ---
  socket.on('game:progress', ({ roomId, progress }) => {
    socket.to(roomId).emit('game:progressUpdate', { socketId: socket.id, progress });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    casualMatchmaking.removeBySocket(socket);
    const affectedRooms = privateLobby.removePlayerBySocket(socket);
    affectedRooms.forEach(affected => {
      if (affected.roomState) {
        io.to(affected.roomId).emit('lobby:state', affected.roomState);
      }
    });
  });
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});