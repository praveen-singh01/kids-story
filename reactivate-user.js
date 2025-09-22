require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./src/models');

async function reactivateUser() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Connect to the same database as the backend
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to database:', mongoose.connection.name);
    
    // Find and reactivate the user
    const targetEmail = 'heyvaibhavs@gmail.com';
    console.log(`\n🔧 Reactivating user: ${targetEmail}`);
    
    const user = await User.findOneAndUpdate(
      { email: targetEmail },
      { 
        isActive: true,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!user) {
      console.log('❌ User not found');
    } else {
      console.log('✅ User reactivated successfully!');
      console.log('\n📋 Updated User Status:');
      console.log('   - ID:', user._id);
      console.log('   - Email:', user.email);
      console.log('   - Name:', user.name);
      console.log('   - isActive:', user.isActive);
      console.log('   - updatedAt:', user.updatedAt);
      
      console.log('\n🎉 The user can now access the /users/me/ endpoint successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

reactivateUser();
