
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');

// --- FIX: Import your local game logic modules ---
const casualMatchmaking = require('./casualMatchmaking');
const privateLobby = require('./privateLobby');
const ranking = require('./ranking');
// ----------------------------------------------------



// --- Define allowed origins ---
// In production, you'll set CLIENT_URL in Render's environment variables.
// In local development, it defaults to the Vite server URL.
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  // You can add more origins here if needed
];

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
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

// Helper function to start a game (assuming this is defined or you can add it)
function startGame(socket1, socket2, gameType = 'casual') {
  const roomId = `game_${socket1.id}_${socket2.id}`;
  const players = [
    { username: socket1.data.username, stats: socket1.data.stats, socketId: socket1.id },
    { username: socket2.data.username, stats: socket2.data.stats, socketId: socket2.id }
  ];

  socket1.join(roomId);
  socket2.join(roomId);

  console.log(`Starting ${gameType} match in room ${roomId} between ${players[0].username} and ${players[1].username}`);
  io.to(roomId).emit('game:start', { roomId, players, gameType });
}


io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}. Transport: ${socket.conn.transport.name}`);

  socket.on('user:init', ({ username, stats }) => {
    socket.data.username = username;
    socket.data.stats = stats || {};
    // Now 'ranking' is defined and this will work
    ranking.ensurePlayer(username, stats);
    console.log(`User ${username} (${socket.id}) initialized.`);
  });
  
  socket.on('casual:enqueue', () => {
    if (!socket.data.username) {
      return socket.emit('error', { message: 'Username not set. Please initialize first.' });
    }
    console.log(`Player ${socket.data.username} is looking for a casual match.`);
    
    // This will now work
    const skillScore = ranking.computeSkillScore(socket.data.stats);

    // And this will also work
    const result = casualMatchmaking.enqueue({
      socket,
      username: socket.data.username,
      stats: socket.data.stats,
      skillScore
    });

    if (result.matched) {
      const opponentSocket = result.opponent.socket;
      console.log(`Match found: ${result.self.username} vs ${result.opponent.username}`);
      startGame(socket, opponentSocket, 'casual');
    } else {
      socket.emit('casual:enqueued');
      console.log(`Player ${socket.data.username} added to the queue.`);
    }
  });

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
