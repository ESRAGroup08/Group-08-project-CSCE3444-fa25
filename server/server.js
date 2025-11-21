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

// A simple in-memory store for game states
const gameRooms = new Map();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

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
    socket.on('player_finished', async ({ roomId, wpm, accuracy }) => {
        const room = gameRooms.get(roomId);
        if (room && room.players[socket.id]) {
            const playerState = room.players[socket.id];
            playerState.finished = true;
            playerState.wpm = wpm;
            playerState.accuracy = accuracy;
            console.log(`Bypassing DB update for ${playerState.username} after finishing.`);
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
        const removedPlayer = casualMatchmaking.removeBySocket(socket);
        if (removedPlayer) {
            console.log(`Removed ${removedPlayer.username} from the casual queue.`);
        }
    });
});

// Final catch-all to serve the React app
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});