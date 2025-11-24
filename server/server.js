const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');
// const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy; // Bypassed
const { randomUUID } = require('crypto');
const casualMatchmaking = require('./casualMatchmaking');
const ranking = require('./ranking');
const privateLobby = require('./privateLobby'); // Import the privateLobby module


const rankedQueue = []; // Placeholder for ranked matchmaking queue
// A simple in-memory store for game states
const gameRooms = new Map();

const app = express();
const server = http.createServer(app);

// --- THIS IS THE FIX ---
// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173", // Your local development environment
  "https://group-08-project-csce3444-fa25.onrender.com", // Your main Render production URL
  "https://group-08-multi-feat-preview.onrender.com" // Your preview Render URL
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST"]
  }
});
// --- END OF FIX ---

const PORT = process.env.PORT || 3000;

console.log("NOTE: MongoDB connection and all DB-related APIs are bypassed for development.");

/* --- ALL DATABASE AND AUTHENTICATION CODE BYPASSED FOR DEVELOPMENT --- */
/*
// Database Connection
mongoose.connect('mongodb://localhost:27017/typing_game')
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Mongoose Schemas
const userSchema = new mongoose.Schema({ ... });
const User = mongoose.model('User', userSchema);
*/

// --- Middleware ---
app.use(cors());
app.use(express.json());

/*
// Sessions and Passport Configuration - Bypassed
app.use(session({
  secret: 'a_secret_key_for_sessions_replace_this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy - Bypassed
passport.use(new GoogleStrategy({ ... }, async (..., done) => { ... }));
passport.serializeUser((user, done) => { ... });
passport.deserializeUser(async (id, done) => { ... });

// Auth & API Routes - Bypassed
app.get('/auth/google', ...);
app.get('/auth/google/callback', ...);
app.get('/api/auth/status', ...);
app.get('/auth/logout', ...);
app.post('/api/login', ...);
app.get('/api/users/:username', ...);
app.put('/api/users/:username', ...);

const friendRouter = express.Router();
friendRouter.use(...);
friendRouter.get('/', ...);
// ... all other friend routes
app.use('/api/friends', friendRouter);
*/
/* --- END OF BYPASSED CODE --- */


// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// --- Socket.IO Logic ---
const TEXT_SNIPPETS = [
    'The quick brown fox jumps over the lazy dog.',
    'A journey of a thousand miles begins with a single step. To be or not to be, that is the question.',
    'Supercalifragilisticexpialidocious pneumatic pseudocode exemplifies paradoxical idiosyncrasies.',
];

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Casual Matchmaking
    socket.on('join_casual', async ({ username }) => {
        try {
            console.log(`${username} (${socket.id}) is looking for a casual match.`);
            const stats = { wpm: 50, accuracy: 95, gamesPlayed: 10 };
            console.log(`Bypassing DB lookup for ${username}. Using placeholder stats.`);
            const skillScore = ranking.computeSkillScore(stats);
            const result = casualMatchmaking.enqueue({ socket, username, stats, skillScore });

            if (result.matched) {
                const { self, opponent } = result;
                const roomId = randomUUID();
                console.log(`Match found! Room: ${roomId}, Players: ${self.username}, ${opponent.username}`);
                const text = TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)];
                const roomState = {
                    roomId, text,
                    players: {
                        [self.socket.id]: { username: self.username, progress: 0, wpm: 0, finished: false },
                        [opponent.socket.id]: { username: opponent.username, progress: 0, wpm: 0, finished: false },
                    }
                };
                gameRooms.set(roomId, roomState);
                self.socket.join(roomId);
                opponent.socket.join(roomId);
                io.to(roomId).emit('match_found', { roomId, players: roomState.players, text });
            } else {
                console.log(`${username} is waiting in the queue.`);
                socket.emit('waiting_for_match');
            }
        } catch (error) {
            console.error('Error during matchmaking:', error);
            socket.emit('matchmaking_error', { message: 'An error occurred while trying to find a match.' });
        }
    });

    // --- NEW: RANKED MATCHMAKING LOGIC ---
    // This whole block is new. It goes right after the casual matchmaking logic.
    socket.on('join_ranked', ({ username }) => {
        const rank = ranking.getRating(username);
        ranking.ensurePlayer(username);

        console.log(`[Ranked] ${username} (Rank: ${rank}) is looking for a ranked match.`);
        
        const opponentIndex = rankedQueue.findIndex(p => Math.abs(p.rank - rank) <= 50);

        if (opponentIndex !== -1) {
            const opponent = rankedQueue.splice(opponentIndex, 1)[0];
            
            const roomId = randomUUID();
            console.log(`[Ranked] Match found! Room: ${roomId}, Players: ${username} vs ${opponent.username}`);
            
            const text = TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)];
            const roomState = {
                roomId, text, isRanked: true, // Flag this as a ranked game
                players: {
                    [socket.id]: { username, rank, progress: 0, wpm: 0, finished: false },
                    [opponent.socket.id]: { username: opponent.username, rank: opponent.rank, progress: 0, wpm: 0, finished: false },
                }
            };
            gameRooms.set(roomId, roomState);
            socket.join(roomId);
            opponent.socket.join(roomId);
            io.to(roomId).emit('match_found', roomState);
        } else {
            rankedQueue.push({ socket, username, rank });
            socket.emit('waiting_for_match');
        }
    });

    // --- CUSTOM LOBBY LOGIC ---
    socket.on('create_lobby', ({ username }) => {
        try {
            const { roomId, roomState } = privateLobby.createRoom({ hostUsername: username, socket });
            socket.join(roomId);
            console.log(`[Lobby] ${username} created lobby ${roomId}`);
            socket.emit('lobby_state_update', { roomId, ...roomState });
        } catch (error) { socket.emit('lobby_error', { message: error.message }); }
    });

    socket.on('join_lobby', ({ username, roomId }) => {
        try {
            const { roomState } = privateLobby.joinRoom({ roomId, username, socket });
            socket.join(roomId);

            console.log(`[Lobby] ${username} joined lobby ${roomId}`);
            io.to(roomId).emit('lobby_state_update', { roomId, ...roomState });
        } catch (error) { socket.emit('lobby_error', { message: error.message }); }
    });

    socket.on('set_ready', ({ roomId, username, isReady }) => {
        try {
            const { roomState } = privateLobby.setReady(roomId, username, isReady);
            console.log(`[Lobby] ${username} in ${roomId} set ready to ${isReady}`);
            io.to(roomId).emit('lobby_state_update', { roomId, ...roomState });
        } catch (error) { socket.emit('lobby_error', { message: error.message }); }
    });

    socket.on('start_game', ({ roomId, username }) => {
    try {
        // Use the public lobby info for checks
        const publicLobby = privateLobby.getLobbyByRoomId(roomId);
        if (!publicLobby) throw new Error("Lobby not found.");
        if (publicLobby.host !== username) throw new Error("Only the host can start the game.");
        if (!privateLobby.allReady(roomId)) throw new Error("Not all players are ready.");

        console.log(`[Lobby] Starting game in lobby ${roomId}`);
        
        const text = TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)];
        const playersState = {};
        
        // Get the full internal player data from the lobby
        const playersMap = publicLobby.players;
        
        // This will now work because playersMap is a Map object
        playersMap.forEach(player => {
            playersState[player.socket.id] = { username: player.username, progress: 0, wpm: 0, finished: false };
        });
        
        gameRooms.set(roomId, { roomId, text, players: playersState });
        
        io.to(roomId).emit('game_starting', { roomId, players: playersState, text });

    } catch (error) {
        console.error(`[Lobby] Error starting game in ${roomId}:`, error.message);
        socket.emit('lobby_error', { message: error.message }); 
    }
});

    // Handle player progress
    socket.on('player_progress', ({ roomId, progress, wpm }) => {
        const room = gameRooms.get(roomId);
        if (room && room.players[socket.id]) {
            room.players[socket.id].progress = progress;
            room.players[socket.id].wpm = wpm;
            socket.to(roomId).emit('opponent_progress', { playerId: socket.id, progress, wpm });
        }
    });
    
    // Handle player finishing
    // --- MODIFIED: PLAYER FINISHED LOGIC (with Rank Updates) ---
    // Replace your old 'player_finished' handler with this one.
    socket.on('player_finished', async ({ roomId, wpm, accuracy }) => {
        const room = gameRooms.get(roomId);
        if (room && room.players[socket.id]) {
            const playerState = room.players[socket.id];
            if(playerState.finished) return; // Prevent finishing more than once

            playerState.finished = true;
            playerState.wpm = wpm;
            playerState.accuracy = accuracy;

            // Check if this is a ranked game and handle rank updates
            if (room.isRanked) {
                const opponents = Object.values(room.players).filter(p => p.username !== playerState.username);
                const winner = playerState;
                const loser = opponents.find(p => !p.finished) || opponents[0];

                if (loser) {
                    const newRatings = ranking.updateRatings(winner.username, loser.username, 1);
                    winner.newRank = newRatings[winner.username];
                    loser.newRank = newRatings[loser.username];
                    console.log(`[Ranked] ${winner.username} wins. New rank: ${winner.newRank}. ${loser.username}'s new rank: ${loser.newRank}.`);
                }
            } else {
                console.log(`Bypassing rank update for non-ranked game.`);
            }

            const allFinished = Object.values(room.players).every(p => p.finished);
            io.to(roomId).emit('game_over', { players: room.players });

            if (allFinished) {
                setTimeout(() => gameRooms.delete(roomId), 10000);
            }
        }
    });

    // Handle disconnects
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        casualMatchmaking.removeBySocket(socket);
        const affectedLobbies = privateLobby.removePlayerBySocket(socket);
        affectedLobbies.forEach(lobby => {
            if (lobby.roomState) {
                io.to(lobby.roomId).emit('lobby_state_update', { roomId: lobby.roomId, ...lobby.roomState });
            }
        });
    });
});

// Final catch-all to serve the React app
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});