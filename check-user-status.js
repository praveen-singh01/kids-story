require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./src/models');

async function checkUserStatus() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Connect to the same database as the backend
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;
    
    console.log('📍 Database URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to database:', mongoose.connection.name);
    
    // Check for the specific user
    const targetEmail = 'heyvaibhavs@gmail.com';
    console.log(`\n🔍 Searching for user: ${targetEmail}`);
    
    const user = await User.findOne({ email: targetEmail });
    
    if (!user) {
      console.log('❌ User not found in database');
      
      // Check if there are any users in the database
      const userCount = await User.countDocuments();
      console.log(`📊 Total users in database: ${userCount}`);
      
      if (userCount > 0) {
        console.log('\n📋 Sample users in database:');
        const sampleUsers = await User.find({}, { email: 1, isActive: 1, name: 1, createdAt: 1 }).limit(5);
        sampleUsers.forEach((u, index) => {
          console.log(`   ${index + 1}. ${u.email} - Active: ${u.isActive} - Created: ${u.createdAt}`);
        });
      }
    } else {
      console.log('✅ User found!');
      console.log('\n📋 User Details:');
      console.log('   - ID:', user._id);
      console.log('   - Email:', user.email);
      console.log('   - Name:', user.name);
      console.log('   - Provider:', user.provider);
      console.log('   - isActive:', user.isActive);
      console.log('   - emailVerified:', user.emailVerified);
      console.log('   - lastLoginAt:', user.lastLoginAt);
      console.log('   - createdAt:', user.createdAt);
      console.log('   - updatedAt:', user.updatedAt);
      
      if (!user.isActive) {
        console.log('\n❌ ISSUE FOUND: User account is deactivated (isActive: false)');
        console.log('🔧 This explains why the API returns "Account is deactivated"');
        
        // Check if we can reactivate the user
        console.log('\n🔧 Would you like to reactivate this user? (This would fix the issue)');
        console.log('   To reactivate: Set isActive to true');
      } else {
        console.log('\n✅ User account is active - the issue might be elsewhere');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkUserStatus();
