const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo'); // Added for session store
const session = require('express-session');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const casualMatchmaking = require('./casualMatchmaking');
const ranking = require('./ranking');
const privateLobby = require('./privateLobby'); // Import the privateLobby module
const { challenges, getDailyChallenges } = require('./challenges');



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

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://game_user:testuser123@gltp0.tez957z.mongodb.net/?appName=GLTP0';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));
// Mongoose Schemas

const dailyChallengeSchema = new mongoose.Schema({
  challengeId: { type: String, required: true },
  completed: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  gamesPlayed: { type: Number, default: 0 },
  averageWPM: { type: Number, default: 0 },
  averageAccuracy: { type: Number, default: 0 },
  eloRating: { type: Number, default: 1000 },
  dailyStats: {
    lastLoginDate: { type: String },
    loginStreak: { type: Number, default: 0 },
    consecutiveWins: { type: Number, default: 0 },
    winsToday: { type: Number, default: 0 },
    dailyChallenges: [dailyChallengeSchema],
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);


// --- Middleware ---
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// 3. Sessions Configuration (This is the block you asked for)
app.set('trust proxy', 1); 
app.use(session({
    secret: process.env.SESSION_SECRET || 'a_very_secure_default_secret_for_dev',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URI, // Use the same MONGO_URI
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: 'none', 
        secure: true, 
    }
}));

// --- Helper Function to manage daily challenges ---
// (This function MUST be defined BEFORE the API routes that use it)
async function checkAndResetDailyChallenges(user) {
  const today = new Date().toDateString();
  // Check if the user's last login was not today
  if (user.dailyStats.lastLoginDate !== today) {
    
    // Check if the last login was yesterday to continue the streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (user.dailyStats.lastLoginDate === yesterday.toDateString()) {
      user.dailyStats.loginStreak += 1;
    } else {
      user.dailyStats.loginStreak = 1; // Reset streak if it wasn't yesterday
    }

    // Reset daily stats and get new challenges
    user.dailyStats.lastLoginDate = today;
    user.dailyStats.dailyChallenges = getDailyChallenges(3); // Get 3 new challenges
    user.dailyStats.consecutiveWins = 0; 
    user.dailyStats.winsToday = 0;
    
    await user.save();
    return true; // Challenges were reset
  }
  return false; // Challenges were not reset
}

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already taken.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save the new user
        const newUser = new User({
            username,
            password: hashedPassword,
        });
        
        await newUser.save();

        // Optional: Log the user in immediately after registration
        await checkAndResetDailyChallenges(newUser);
        req.session.user = { id: newUser._id, username: newUser.username };

        res.status(201).json({ message: 'User created successfully!', username: newUser.username });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// API Route for User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        
        // --- This is where we integrate the logic from presentation-demo ---
        // Check and update daily stats on login
        await checkAndResetDailyChallenges(user);
        
        // Store user info in the session to log them in
        req.session.user = { id: user._id, username: user.username };
        res.status(200).json({ message: 'Logged in successfully', username: user.username });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Check if a user is logged in
app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        res.status(200).json({ loggedIn: false });
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out, please try again.' });
        }
        res.clearCookie('connect.sid'); // The default session cookie name
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

// Get User Profile Data
app.get('/api/users/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-friends');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching user data.' });
    }
});

// Update Username
app.put('/api/users/:username', async (req, res) => {
    // Ensure user is logged in and is the one they are trying to update
    if (!req.session.user || req.session.user.username !== req.params.username) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    try {
        const { newUsername } = req.body;
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.username = newUsername;
        await user.save();

        // Update session with new username
        req.session.user.username = newUsername;

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating username.' });
    }
});


// 5. Friend Management API Routes
const friendRouter = express.Router();

// Middleware to ensure user is authenticated for all friend routes
friendRouter.use((req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    req.userId = req.session.user.id; // Add userId to the request object for easier access
    next();
});

// GET /api/friends - Fetch all friends and requests for the logged-in user
friendRouter.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('friends', 'username') // Only get username for friends
            .populate('friendRequestsSent', 'username')
            .populate('friendRequestsReceived', 'username');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            friends: user.friends,
            sentRequests: user.friendRequestsSent,
            receivedRequests: user.friendRequestsReceived
        });
    } catch (error) {
        console.error('Error fetching friend data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/friends/search - Search for users
friendRouter.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        const currentUser = await User.findById(req.userId);
        const allFriendsAndRequests = [
            ...currentUser.friends,
            ...currentUser.friendRequestsSent,
            ...currentUser.friendRequestsReceived,
            currentUser._id // also exclude self
        ];

        // Find users whose username matches the query, are not the user themselves,
        // and are not already friends or have a pending request.
        const users = await User.find({
            username: { $regex: query, $options: 'i' }, // Case-insensitive search
            _id: { $nin: allFriendsAndRequests } // Exclude users in the array
        }).select('username'); // Only send back the username and _id

        res.status(200).json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Server error during search' });
    }
});

// POST /api/friends/request/:userId - Send a friend request
friendRouter.post('/request/:userId', async (req, res) => {
    const recipientId = req.params.userId;
    const requesterId = req.userId;

    if (recipientId === requesterId) {
        return res.status(400).json({ message: 'You cannot send a friend request to yourself.' });
    }

    try {
        const requester = await User.findById(requesterId);
        const recipient = await User.findById(recipientId);

        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found.' });
        }
        
        // Check if already friends or if a request was already sent
        if (requester.friends.includes(recipientId)) {
            return res.status(400).json({ message: 'You are already friends.' });
        }
        if (requester.friendRequestsSent.includes(recipientId)) {
            return res.status(400).json({ message: 'Friend request already sent.' });
        }
        if (requester.friendRequestsReceived.includes(recipientId)) {
            return res.status(400).json({ message: 'This user has already sent you a friend request. Please accept or reject it.'})
        }

        // Add request to both users
        recipient.friendRequestsReceived.push(requesterId);
        requester.friendRequestsSent.push(recipientId);

        await recipient.save();
        await requester.save();

        res.status(200).json({ message: 'Friend request sent.' });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/friends/accept/:userId - Accept a friend request
friendRouter.post('/accept/:userId', async (req, res) => {
    const requesterId = req.params.userId;
    const recipientId = req.userId; // The logged-in user is the one accepting

    try {
        const requester = await User.findById(requesterId);
        const recipient = await User.findById(recipientId);

        // Check if a request actually exists
        if (!recipient.friendRequestsReceived.includes(requesterId)) {
            return res.status(400).json({ message: 'No friend request from this user.' });
        }

        // --- Perform the transaction ---
        // 1. Remove the request from both sides
        recipient.friendRequestsReceived.pull(requesterId);
        requester.friendRequestsSent.pull(recipientId);

        // 2. Add each other to their friends lists
        recipient.friends.push(requesterId);
        requester.friends.push(recipientId);

        await requester.save();
        await recipient.save();

        res.status(200).json({ message: 'Friend request accepted.' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/friends/reject/:userId - Reject, Cancel, or Unfriend
// This one endpoint handles multiple cases based on the relationship status
friendRouter.post('/reject/:userId', async (req, res) => {
    const otherUserId = req.params.userId;
    const currentUserId = req.userId;

    try {
        const currentUser = await User.findById(currentUserId);
        const otherUser = await User.findById(otherUserId);

        if (!otherUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Case 1: Rejecting a received request
        if (currentUser.friendRequestsReceived.includes(otherUserId)) {
            currentUser.friendRequestsReceived.pull(otherUserId);
            otherUser.friendRequestsSent.pull(currentUserId);
            await currentUser.save();
            await otherUser.save();
            return res.status(200).json({ message: 'Friend request rejected.' });
        }
        // Case 2: Canceling a sent request
        else if (currentUser.friendRequestsSent.includes(otherUserId)) {
            currentUser.friendRequestsSent.pull(otherUserId);
            otherUser.friendRequestsReceived.pull(currentUserId);
            await currentUser.save();
            await otherUser.save();
            return res.status(200).json({ message: 'Friend request canceled.' });
        }
        // Case 3: Unfriending a current friend
        else if (currentUser.friends.includes(otherUserId)) {
            currentUser.friends.pull(otherUserId);
            otherUser.friends.pull(currentUserId);
            await currentUser.save();
            await otherUser.save();
            return res.status(200).json({ message: 'User unfriended.' });
        }
        // Case 4: No relationship found
        else {
            return res.status(400).json({ message: 'No relationship to remove.' });
        }

    } catch (error) {
        console.error('Error in reject/cancel/unfriend action:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Mount the router on the main app
app.use('/api/friends', friendRouter);

// --- NEW: API Endpoint for Daily Challenges ---
app.get('/api/challenges', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Ensure challenges are up-to-date for the day
    await checkAndResetDailyChallenges(user);

    // Populate challenges with full data from the `challenges` map
    const populatedChallenges = user.dailyStats.dailyChallenges.map(c => {
      const challengeData = challenges.get(c.challengeId);
      return { ...challengeData, ...c.toObject() };
    });

    res.status(200).json({
      loginStreak: user.dailyStats.loginStreak,
      totalRewards: user.rankingPoints,
      challenges: populatedChallenges,
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find({})
            .sort({ eloRating: -1 }) // Sort by eloRating
            .limit(25)
            .select('username eloRating averageWPM'); // Select the new field

        res.status(200).json(topPlayers);
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        res.status(500).json({ message: 'Server error fetching leaderboard.' });
    }
});

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
    
    // A centralized function to end the game, calculate winners, and clean up.
    function endGame(roomId) {
        const room = gameRooms.get(roomId);
        if (!room) return;

        // If the timer is still running, clear it.
        if (room.suddenDeathTimer) {
            clearTimeout(room.suddenDeathTimer);
            delete room.suddenDeathTimer;
        }

        const finishedPlayers = Object.values(room.players).filter(p => p.finished);
        
        if (finishedPlayers.length > 0) {
            const winner = finishedPlayers.reduce((prev, current) => {
                return ((current.wpm || 0) > (prev.wpm || 0)) ? current : prev;
            });
            
            const loser = finishedPlayers.find(p => p.username !== winner.username);

            // Rank updates for ranked games
            if (room.isRanked && loser) {
                const newRatings = ranking.updateRatings(winner.username, loser.username, 1);
                winner.newRank = newRatings[winner.username];
                loser.newRank = newRatings[loser.username];
                console.log(`[Ranked] ${winner.username} wins. New rank: ${winner.newRank}. ${loser.username}'s new rank: ${loser.newRank}.`);
            } else {
                console.log(`[Game] ${winner.username} wins with ${winner.wpm} WPM!`);
            }
        }

        io.to(roomId).emit('game_over', { players: room.players });
        stopGameLoop(roomId);
        setTimeout(() => gameRooms.delete(roomId), 10000);
    }
    
    // Handle player finishing
    socket.on('player_finished', async ({ roomId, wpm, accuracy }) => {
        const room = gameRooms.get(roomId);
        if (!room || !room.players[socket.id] || room.players[socket.id].finished) {
            return; // Ignore if room/player doesn't exist or already finished
        }

        const playerState = room.players[socket.id];
        playerState.finished = true;
        playerState.wpm = wpm;
        playerState.accuracy = accuracy;
        
        // Let other clients know this player has finished, so their UI can update.
        io.to(roomId).emit('opponent_progress', { 
            playerId: socket.id,
            progress: 100,
            wpm: Math.round(wpm),
            finished: true
        });

        const playerStates = Object.values(room.players);
        const finishedCount = playerStates.filter(p => p.finished).length;
        const totalPlayers = playerStates.length;

        // If all players have finished, end the game immediately.
        if (finishedCount === totalPlayers) {
            console.log(`[Game] All players finished in room ${roomId}. Ending game.`);
            if (room.suddenDeathTimer) {
                clearTimeout(room.suddenDeathTimer);
            }
            endGame(roomId);
        }
        // If this is the first player to finish in a multiplayer game, start the countdown.
        else if (finishedCount === 1 && totalPlayers > 1) {
            console.log(`[Game] First player finished in room ${roomId}. Starting 15s countdown.`);
            const countdownDuration = 15;
            io.to(roomId).emit('suddenDeath', { duration: countdownDuration });
            
            // Start the server-side timer.
            room.suddenDeathTimer = setTimeout(() => {
                console.log(`[Game] Sudden death timer for room ${roomId} ended.`);
                endGame(roomId);
            }, countdownDuration * 1000);
        }
        // If it's a solo game, end immediately
        else if (totalPlayers === 1) {
            endGame(roomId);
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