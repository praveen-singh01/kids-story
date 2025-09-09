const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import models
const Content = require('../src/models/Content');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test content data based on actual assets in backend/Assets folder
const testContent = [
  {
    type: 'story',
    title: 'Buddha and Angulimala',
    description: 'A beautiful story about compassion and transformation from Buddhist teachings.',
    durationSec: 300,
    ageRange: '6-8',
    defaultLanguage: 'en',
    availableLanguages: ['en'],
    isNewCollection: true,
    isTrendingNow: false,
    isFeatured: true,
    languages: {
      en: {
        title: 'Buddha and Angulimala',
        description: 'A beautiful story about compassion and transformation from Buddhist teachings.',
        audioUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/audio/ElevenLabs_buddha_and_angulimala.mp3',
        imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/image/English_buddha.png',
        thumbnailUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/image/English_buddha.png'
      }
    },
    metadata: {
      keyValue: 'buddha-and-angulimala',
      summary: 'A beautiful story about compassion and transformation from Buddhist teachings.'
    },
    tags: ['buddhist', 'compassion', 'transformation'],
    isActive: true
  },
  {
    type: 'story',
    title: 'The Brahmin and the Crooks',
    description: 'A wise tale about intelligence and cunning from ancient Indian folklore.',
    durationSec: 240,
    ageRange: '6-8',
    defaultLanguage: 'en',
    availableLanguages: ['en', 'hi'],
    isNewCollection: false,
    isTrendingNow: true,
    isFeatured: false,
    languages: {
      en: {
        title: 'The Brahmin and the Crooks',
        description: 'A wise tale about intelligence and cunning from ancient Indian folklore.',
        audioUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/audio/ElevenLabs_The_Brahmin_and_the_Crooks_english.mp3',
        imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/image/English_bhramin.png',
        thumbnailUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/image/English_bhramin.png'
      },
      hi: {
        title: 'ब्राह्मण और ठग',
        description: 'प्राचीन भारतीय लोककथाओं से बुद्धि और चालाकी की एक बुद्धिमान कहानी।',
        audioUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/audio/ElevenLabs_brahmin_and_crooks_-_hindi.mp3',
        imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/image/Hindi_bhraman.png',
        thumbnailUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/image/Hindi_bhraman.png'
      }
    },
    metadata: {
      keyValue: 'brahmin-and-crooks',
      summary: 'A wise tale about intelligence and cunning from ancient Indian folklore.'
    },
    tags: ['folklore', 'wisdom', 'intelligence'],
    isActive: true
  }
];

const populateContent = async () => {
  try {
    console.log('🧹 Clearing existing content...');
    await Content.deleteMany({});

    console.log('📝 Creating test content...');
    for (const contentData of testContent) {
      const content = new Content(contentData);
      await content.save();
      console.log(`✅ Created: ${contentData.title}`);
    }

    console.log('🎉 Test stories populated successfully!');
    console.log(`📊 Total stories created: ${testContent.length}`);

    // Show summary
    const newCollections = testContent.filter(c => c.isNewCollection).length;
    const trending = testContent.filter(c => c.isTrendingNow).length;
    const featured = testContent.filter(c => c.isFeatured).length;
    const bilingual = testContent.filter(c => c.availableLanguages.includes('hi')).length;

    console.log(`📈 New Collections: ${newCollections}`);
    console.log(`🔥 Trending Now: ${trending}`);
    console.log(`⭐ Featured: ${featured}`);
    console.log(`🌐 Bilingual (Hindi): ${bilingual}`);

  } catch (error) {
    console.error('❌ Error populating content:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
const main = async () => {
  console.log('🚀 Starting test content population...');
  await connectDB();
  await populateContent();
};

main().catch(console.error);
