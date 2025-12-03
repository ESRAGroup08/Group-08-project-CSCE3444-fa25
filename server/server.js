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



const app = express();
const server = http.createServer(app);

// --- THIS IS THE FIX ---
// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173", // Your local development environment (Vite default)
  "http://localhost:5174", // Vite fallback port if 5173 is in use
  "http://localhost:5175", // Additional fallback ports
  "http://localhost:5176",
  "https://group-08-project-csce3444-fa25.onrender.com", // Your main Render production URL
  "https://group-08-multi-feat-preview.onrender.com" // Your preview Render URL
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Use the array directly for simplicity and robustness
    methods: ["GET", "POST"],
    credentials: true
  },
  // Allow Socket.IO to handle both polling and WebSocket transports.
  // This is crucial for reliability behind reverse proxies like Render's.
  transports: ['polling', 'websocket'],
  // Tell Socket.IO to trust the proxy headers from Render.
  // This helps it correctly identify the client's origin and IP.
  allowEIO3: true,
  proxy: true, 
});
// --- END OF FIX ---



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
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));
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

const PORT = process.env.PORT || 3000;
console.log("NOTE: MongoDB connection and all DB-related APIs are bypassed for development.");


// --- Socket.IO Logic ---
const TEXT_SNIPPETS = [
    'The quick brown fox jumps over the lazy dog.',
    'A journey of a thousand miles begins with a single step. To be or not to be, that is the question.',
    'Supercalifragilisticexpialidocious pneumatic pseudocode exemplifies paradoxical idiosyncrasies.',
];

const gameRooms = new Map();
const PERKS = ['ASTEROID_ATTACK', 'ROCKET_FUEL'];
const rankedQueue = []; // Placeholder for ranked matchmaking queue
// A simple in-memory store for game states

function startGameLoop(roomId) {
    const room = gameRooms.get(roomId);
    if (!room) return;

    // Grant perks every 5-7 seconds
    const perkInterval = Math.random() * 2000 + 5000;

    room.gameInterval = setInterval(() => {
        const playerIds = Object.keys(room.players);
        const now = Date.now();
        const cooldown = 4000 + Math.random() * 1000; // 4-5 seconds cooldown

        const eligiblePlayers = playerIds.filter(id => {
            const player = room.players[id];
            // A player is eligible if they don't have a perk AND their cooldown has passed.
            return !player.perk && (now - (player.perkUsedAt || 0) > cooldown);
        });

        if (eligiblePlayers.length > 0) {
            const randomPlayerId = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
            const randomPerk = PERKS[Math.floor(Math.random() * PERKS.length)];
            
            room.players[randomPlayerId].perk = randomPerk;
            io.to(randomPlayerId).emit('perk_granted', { perk: randomPerk });
            console.log(`[Game Loop] Granted '${randomPerk}' to player ${randomPlayerId} in room ${roomId}`);
        }
    }, perkInterval);
}

function stopGameLoop(roomId) {
    const room = gameRooms.get(roomId);
    if (room && room.gameInterval) {
        clearInterval(room.gameInterval);
        delete room.gameInterval;
        console.log(`[Game Loop] Stopped for room ${roomId}`);
    }
}


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
                        [self.socket.id]: { username: self.username, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 },
                        [opponent.socket.id]: { username: opponent.username, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 },
                    }
                };
                gameRooms.set(roomId, roomState);
                self.socket.join(roomId);
                opponent.socket.join(roomId);
                io.to(roomId).emit('match_found', { roomId, players: roomState.players, text });
                startGameLoop(roomId);
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
        
         // First, check if this player is already in the queue to prevent duplicates.
        if (rankedQueue.some(p => p.username === username)) {
            console.log(`[Ranked] ${username} is already in the queue. Ignoring duplicate request.`);
            // Optionally, let the client know it's already waiting
            socket.emit('waiting_for_match'); 
            return; // Stop execution here
        }
        
        const rank = ranking.getRating(username);
        ranking.ensurePlayer(username);

        console.log(`[Ranked] ${username} (Rank: ${rank}) is looking for a ranked match.`);
        
        const opponentIndex = rankedQueue.findIndex(
        p => p.username !== username && Math.abs(p.rank - rank) <= 50
        );

        if (opponentIndex !== -1) {
            const opponent = rankedQueue.splice(opponentIndex, 1)[0];
            
            const roomId = randomUUID();
            console.log(`[Ranked] Match found! Room: ${roomId}, Players: ${username} vs ${opponent.username}`);
            
            const text = TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)];
            const roomState = {
                roomId, text, isRanked: true, // Flag this as a ranked game
                players: {
                    [socket.id]: { username, rank, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 },
                    [opponent.socket.id]: { username: opponent.username, rank: opponent.rank, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 },
                }
            };
            gameRooms.set(roomId, roomState);
            socket.join(roomId);
            opponent.socket.join(roomId);
            io.to(roomId).emit('match_found', roomState);
            startGameLoop(roomId);
        } else {
            rankedQueue.push({ socket, username, rank });
            socket.emit('waiting_for_match');
            console.log(`[Ranked] ${username} added to the queue. Current queue size: ${rankedQueue.length}`);
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
            playersState[player.socket.id] = { username: player.username, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 };
        });
        
        gameRooms.set(roomId, { roomId, text, players: playersState });
        
        io.to(roomId).emit('game_starting', { roomId, players: playersState, text });
        startGameLoop(roomId);

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

    // --- PERK USAGE ---
    socket.on('use_perk', ({ roomId, perk }) => {
        const room = gameRooms.get(roomId);
        const player = room?.players[socket.id];

        if (!player || player.perk !== perk) {
            console.log(`[Perk] Invalid perk usage by ${socket.id}. Has: ${player?.perk}, Tried: ${perk}`);
            return;
        }

        console.log(`[Perk] Player ${socket.id} used ${perk} in room ${roomId}`);
        player.perk = null; // Consume the perk
        player.perkUsedAt = Date.now(); // Set the cooldown timestamp
        socket.emit('perk_used'); // Tell client the perk is gone

        if (perk === 'ASTEROID_ATTACK') {
            socket.to(roomId).emit('asteroid_hit');
        } else if (perk === 'ROCKET_FUEL') {
            const currentProgress = player.progress || 0;
            const text = room.text;
            
            const currentLength = Math.floor(text.length * (currentProgress / 100));
            const boostLength = Math.floor(text.length * 0.25);
            
            const autoCompletedText = text.substring(currentLength, currentLength + boostLength);

            socket.emit('perk_effect_rocket_fuel', { autoCompletedText });
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

            // Check if ALL players are finished
            const allFinished = Object.values(room.players).every(p => p.finished);
            
            if (allFinished) {
                // Determine winner based on highest WPM among all finished players
                const finishedPlayers = Object.values(room.players).filter(p => p.finished);
                const winner = finishedPlayers.reduce((prev, current) => 
                    ((current.wpm || 0) > (prev.wpm || 0)) ? current : prev
                );
                
                const loser = finishedPlayers.find(p => p.username !== winner.username);

                // Check if this is a ranked game and handle rank updates
                if (room.isRanked && loser) {
                    const newRatings = ranking.updateRatings(winner.username, loser.username, 1);
                    winner.newRank = newRatings[winner.username];
                    loser.newRank = newRatings[loser.username];
                    console.log(`[Ranked] ${winner.username} wins (${winner.wpm} WPM). New rank: ${winner.newRank}. ${loser.username}'s new rank: ${loser.newRank}.`);
                } else {
                    console.log(`[Game] ${winner.username} wins with ${winner.wpm} WPM!`);
                }

                // Emit game over with final player states
                io.to(roomId).emit('game_over', { players: room.players });
                
                stopGameLoop(roomId);
                setTimeout(() => gameRooms.delete(roomId), 10000);
            } else {
                // Not all finished yet, just broadcast the update
                io.to(roomId).emit('game_over', { players: room.players });
            }
        }
    });

    // Handle disconnects
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        casualMatchmaking.removeBySocket(socket);
        // Stop any game loops this player was in
        for (const [roomId, room] of gameRooms.entries()) {
            if (room.players[socket.id]) {
                const allFinished = Object.values(room.players).every(p => p.finished || p.socket.id === socket.id);
                if (allFinished) {
                    stopGameLoop(roomId);
                }
            }
        }
        const affectedLobbies = privateLobby.removePlayerBySocket(socket);
        affectedLobbies.forEach(lobby => {
            if (lobby.roomState) {
                io.to(lobby.roomId).emit('lobby_state_update', { roomId: lobby.roomId, ...lobby.roomState });
            }
        });
    });
});

// Final catch-all to serve the React app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- 7. Start the Server ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);
});