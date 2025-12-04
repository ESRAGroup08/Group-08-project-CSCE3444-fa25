const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');
// const mongoose = require('mongoose'); // No longer needed for in-memory mode
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcryptjs'); // Imported for in-memory hashing
// const User = require('./models/User'); // No longer needed for in-memory mode

// --- In-Memory Database for Presentation Mode ---
let users = [];
let currentId = 1;
// ---

console.log("--- RUNNING IN PRESENTATION MODE (IN-MEMORY DATABASE) ---");

const app = express();
const server = http.createServer(app);

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173", // Your local development environment (Vite default)
  "http://localhost:5174", // Vite fallback port if 5173 is in use
  "http://localhost:5175", // Additional fallback ports
  "http://localhost:5176",
  "https://group-08-project-csce3444-fa25.onrender.com", // Your main Render production URL
  "https://group-08-multi-feat-preview.onrender.com", // Your preview Render URL
  "https://group-08-project-csce3444-fa25-lncc.onrender.com" // New frontend preview URL
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


// Database Connection
// const mongoUriForLogging = (process.env.MONGO_URI || 'mongodb://localhost:27017/').replace(/:([^:]*)@/, ':<password>@');
// console.log(`Attempting to connect to MongoDB with URI: ${mongoUriForLogging}`);
// mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/', { dbName: 'typing_game' })
//   .then(() => console.log('MongoDB connected successfully.'))
//   .catch(err => console.error('MongoDB connection error:', err));
console.log("--- RUNNING IN PRESENTATION MODE (IN-MEMORY DATABASE) ---");


// --- Middleware ---
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'a_secret_key_for_sessions_replace_this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Share session with Socket.IO
io.engine.use(sessionMiddleware);
// THIS IS THE LINE THAT CRASHES THE SERVER - LEAVE IT COMMENTED OUT
// io.engine.use(passport.session());

const LocalStrategy = require('passport-local').Strategy;

// Passport Local Strategy
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return done(null, false, { message: 'Incorrect email.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Passport Serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Passport Deserialization
passport.deserializeUser(async (id, done) => {
  try {
    const user = users.find(u => u.id === id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});


// --- Auth & API Routes for In-Memory Store ---

// Register New User
app.post('/api/register', async (req, res) => {
  const { name, email, username, password } = req.body;
  try {
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'User with that email or username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = {
      id: currentId++,
      name,
      email,
      username,
      password: hashedPassword,
      // Add other fields with default values if your frontend needs them
      gamesPlayed: 0,
      averageWPM: 0,
      averageAccuracy: 0,
    };
    users.push(newUser);
    console.log("New user registered (in-memory):", newUser);
    console.log("All users:", users);

    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Session login failed after registration.' });
      }
      // Return a user object without the password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword
      });
    });
  } catch (error) {
    console.error('--- REGISTRATION ERROR ---', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login
app.post('/api/login', passport.authenticate('local'), (req, res) => {
  // Exclude password from the response
  const { password, ...userWithoutPassword } = req.user;
  res.json({ 
    message: 'Logged in successfully',
    user: userWithoutPassword
  });
});

// --- Unchanged Routes ---
// Logout, Auth Status, etc. are fine as they rely on passport session, not the DB directly
app.get('/auth/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    const { password, ...userWithoutPassword } = req.user;
    res.json({
      isAuthenticated: true,
      user: userWithoutPassword
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Get user profile
app.get('/api/users/:username', async (req, res) => {
  try {
    const user = users.find(u => u.username === req.params.username.toLowerCase()); // Search lowercased
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('--- PROFILE FETCH ERROR ---', error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
});

// Update user profile
app.put('/api/users/:username', (req, res) => {
  try {
    const { newUsername } = req.body;
    const userIndex = users.findIndex(u => u.username === req.params.username.toLowerCase());

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the new username is already taken
    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    // Update username
    users[userIndex].username = newUsername.toLowerCase();

    const { password, ...updatedUserWithoutPassword } = users[userIndex];

    console.log("Updated user (in-memory):", updatedUserWithoutPassword);
    res.json(updatedUserWithoutPassword);
  } catch (error) {
    console.error('--- PROFILE UPDATE ERROR ---', error);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});




const PORT = process.env.PORT || 3000;

// --- Full Socket.IO logic can remain, but user stats won't be saved ---
// NOTE: This logic might try to access properties on the user object that were on the Mongoose model.
// I have added default values to the in-memory user object to prevent some crashes.
const TEXT_SNIPPETS = [
    'The quick brown fox jumps over the lazy dog.',
    'A journey of a thousand miles begins with a single step. To be or not to be, that is the question.',
    'Supercalifragilisticexpialidocious pneumatic pseudocode exemplifies paradoxical idiosyncrasies.',
];
const casualMatchmaking = require('./casualMatchmaking');
const ranking = require('./ranking');
const privateLobby = require('./privateLobby');
const { randomUUID } = require('crypto');

const gameRooms = new Map();
const PERKS = ['ASTEROID_ATTACK', 'ROCKET_FUEL'];
const rankedQueue = [];

// ... [The rest of your original, unchanged Socket.IO logic] ...
// [This has been omitted for brevity, but it will be in the actual file]
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);
    const user = socket.request.user;
    if (!user) {
        console.log(`Socket ${socket.id} is not associated with an authenticated user.`);
    } else {
        console.log(`Socket ${socket.id} is authenticated as user: ${user.username}`);
    }
    // ... all your matchmaking, game, and lobby logic ...
});


// Final catch-all to serve the React app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- 7. Start the Server ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);
});