const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/typing_game')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Connection error:', err));

// Define User schema
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

async function addTestFriendsToUser() {
  try {
    // Get or create the main user (TestUser)
    let mainUser = await User.findOne({ username: 'TestUser' });
    if (!mainUser) {
      mainUser = await User.create({ username: 'TestUser' });
      console.log('Created TestUser');
    }

    // Create test1 to test10 users
    const testUsernames = [];
    for (let i = 1; i <= 10; i++) {
      const username = `test${i}`;
      let testUser = await User.findOne({ username });
      
      if (!testUser) {
        testUser = await User.create({ username });
        console.log(`Created ${username}`);
      }
      testUsernames.push({ username, _id: testUser._id });
    }

    // Add all test users as friends to TestUser
    for (const testUser of testUsernames) {
      if (!mainUser.friends.includes(testUser._id)) {
        mainUser.friends.push(testUser._id);
        console.log(`Added ${testUser.username} as friend to TestUser`);
      }
      
      // Also add TestUser as friend to the test user
      const updatedTestUser = await User.findById(testUser._id);
      if (!updatedTestUser.friends.includes(mainUser._id)) {
        updatedTestUser.friends.push(mainUser._id);
        await updatedTestUser.save();
      }
    }

    // Save the main user
    await mainUser.save();
    console.log('✓ Successfully added 10 test friends to TestUser');
    
    // Display the results
    const updatedUser = await User.findById(mainUser._id).populate('friends', 'username');
    console.log(`\nTestUser now has ${updatedUser.friends.length} friends:`);
    updatedUser.friends.forEach(friend => {
      console.log(`  - ${friend.username}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTestFriendsToUser();
