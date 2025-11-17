const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// --- Database Connection ---
mongoose.connect('mongodb://localhost:27017/typing_game')
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const userSchema = new mongoose.Schema({
  googleId: { type: String, sparse: true, unique: true },
  username: { type: String, required: true, unique: true, trim: true },
  gamesPlayed: { type: Number, default: 0 },
  averageWPM: { type: Number, default: 0 },
  averageAccuracy: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const User = mongoose.model('User', userSchema);

// --- Middleware ---
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Sessions and Passport Configuration
app.use(session({
  secret: 'a_secret_key_for_sessions_replace_this', // Replace with a real secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your Google Client ID
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET', // Replace with your Google Client Secret
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        return done(null, user);
      } else {
        // Create a new user
        const newUser = new User({
          googleId: profile.id,
          username: profile.displayName || `User${profile.id}`
        });
        // Ensure username is unique
        const existingUser = await User.findOne({ username: newUser.username });
        if (existingUser) {
          newUser.username = `User${profile.id.slice(-5)}`;
        }
        await newUser.save();
        return done(null, newUser);
      }
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// --- Auth Routes ---
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // On successful authentication, store username in a way the client can access
    if (req.user) {
      res.cookie('username', req.user.username, { httpOnly: false }); // Make accessible to client-side script
    }
    // Redirect to the main menu or a specific page
    res.redirect('/#/menu');
  }
);

app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get('/auth/logout', (req, res, next) => {
  res.clearCookie('username');
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});


// --- API Endpoints ---
// Login or Register a user
app.post('/api/login', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await User.findOneAndUpdate(
      { username: username },
      { $setOnInsert: { username: username } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error during login/registration', error });
  }
});

// Get user profile
app.get('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update user profile
app.put('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { newUsername } = req.body;

    if (!newUsername) {
      return res.status(400).json({ message: 'New username is required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { username: username },
      { username: newUsername },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    // Handle potential duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }
    res.status(500).json({ message: 'Server error', error });
  }
});

// --- Friend System API Endpoints ---
const friendRouter = express.Router();

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'You must be logged in to perform this action.' });
};

friendRouter.use(isAuthenticated);

// Get all friend data for the logged-in user
friendRouter.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'username')
      .populate('friendRequestsSent', 'username')
      .populate('friendRequestsReceived', 'username');
    res.json({
      friends: user.friends,
      sentRequests: user.friendRequestsSent,
      receivedRequests: user.friendRequestsReceived
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Search for users
friendRouter.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: 'Search query is required.' });
    }
    try {
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user.id } // Exclude self
        }).select('username');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


// Send a friend request
friendRouter.post('/request/:userId', async (req, res) => {
  try {
    const recipient = await User.findById(req.params.userId);
    const sender = await User.findById(req.user.id);

    if (!recipient) return res.status(404).json({ message: 'Recipient not found.' });
    if (sender.id === recipient.id) return res.status(400).json({ message: 'You cannot send a friend request to yourself.' });
    if (sender.friends.includes(recipient.id)) return res.status(400).json({ message: 'You are already friends.' });
    if (sender.friendRequestsSent.includes(recipient.id)) return res.status(400).json({ message: 'Friend request already sent.' });

    recipient.friendRequestsReceived.push(sender.id);
    sender.friendRequestsSent.push(recipient.id);

    await recipient.save();
    await sender.save();

    res.status(200).json({ message: 'Friend request sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Accept a friend request
friendRouter.post('/accept/:userId', async (req, res) => {
    try {
        const sender = await User.findById(req.params.userId);
        const recipient = await User.findById(req.user.id);

        if (!sender) return res.status(404).json({ message: 'User not found.' });

        // Atomically update both users
        await User.updateOne({ _id: recipient.id }, {
            $pull: { friendRequestsReceived: sender.id },
            $addToSet: { friends: sender.id }
        });
        await User.updateOne({ _id: sender.id }, {
            $pull: { friendRequestsSent: recipient.id },
            $addToSet: { friends: recipient.id }
        });

        res.status(200).json({ message: 'Friend request accepted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Reject or cancel a friend request / unfriend
friendRouter.post('/reject/:userId', async (req, res) => {
    try {
        const otherUser = await User.findById(req.params.userId);
        const currentUser = await User.findById(req.user.id);

        if (!otherUser) return res.status(404).json({ message: 'User not found.' });

        // Atomically update both users
        await User.updateOne({ _id: currentUser.id }, {
            $pull: { friends: otherUser.id, friendRequestsReceived: otherUser.id, friendRequestsSent: otherUser.id }
        });
        await User.updateOne({ _id: otherUser.id }, {
            $pull: { friends: currentUser.id, friendRequestsReceived: currentUser.id, friendRequestsSent: currentUser.id }
        });

        res.status(200).json({ message: 'Action completed.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


app.use('/api/friends', friendRouter);


// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});