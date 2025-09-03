const mongoose = require('mongoose');
require('dotenv').config();

const { User, Content, Avatar, Category } = require('../models');
const logger = require('../config/logger');

// Sample data for seeding
const sampleAvatars = [
  {
    name: 'Wizard',
    src: 'https://cdn.example.com/avatars/wizard.png',
    type: 'raster',
    bgColorHex: '#4A90E2',
    borderColorHex: '#2E5C8A',
    selectionColorHex: '#673AB7',
    sortOrder: 1
  },
  {
    name: 'Princess',
    src: 'https://cdn.example.com/avatars/princess.png',
    type: 'raster',
    bgColorHex: '#F5A623',
    borderColorHex: '#D68910',
    selectionColorHex: '#E91E63',
    sortOrder: 2
  },
  {
    name: 'Dragon',
    src: 'https://cdn.example.com/avatars/dragon.svg',
    type: 'svg',
    bgColorHex: '#50E3C2',
    borderColorHex: '#2ECC71',
    selectionColorHex: '#9C27B0',
    sortOrder: 3
  },
  {
    name: 'Knight',
    src: 'https://cdn.example.com/avatars/knight.png',
    type: 'raster',
    bgColorHex: '#BD10E0',
    borderColorHex: '#8E44AD',
    selectionColorHex: '#3F51B5',
    sortOrder: 4
  }
];

const sampleCategories = [
  {
    name: 'Bedtime Stories',
    description: 'Gentle stories perfect for bedtime',
    imageUrl: 'https://cdn.example.com/categories/bedtime.jpg',
    sortOrder: 1
  },
  {
    name: 'Adventure Tales',
    description: 'Exciting adventures for young explorers',
    imageUrl: 'https://cdn.example.com/categories/adventure.jpg',
    sortOrder: 2
  },
  {
    name: 'Learning Stories',
    description: 'Educational stories that teach while entertaining',
    imageUrl: 'https://cdn.example.com/categories/learning.jpg',
    sortOrder: 3
  },
  {
    name: 'Meditation',
    description: 'Calming meditation sessions for kids',
    imageUrl: 'https://cdn.example.com/categories/meditation.jpg',
    sortOrder: 4
  }
];

const sampleContent = [
  {
    type: 'story',
    title: 'The Sleepy Forest',
    description: 'A magical journey through a peaceful forest where all the animals are getting ready for bed.',
    durationSec: 720,
    ageRange: '3-5',
    tags: ['bedtime', 'forest', 'animals', 'peaceful'],
    language: 'en',
    region: 'US',
    audioUrl: 'https://cdn.example.com/audio/sleepy-forest.mp3',
    imageUrl: 'https://cdn.example.com/images/sleepy-forest.jpg',
    isFeatured: true,
    popularityScore: 4.8,
    metadata: {
      keyValue: 'Peaceful Sleep',
      summary: 'A gentle bedtime story about forest animals preparing for sleep.'
    }
  },
  {
    type: 'story',
    title: 'The Brave Little Mouse',
    description: 'Follow the adventures of a courageous mouse who helps his friends overcome their fears.',
    durationSec: 900,
    ageRange: '6-8',
    tags: ['adventure', 'courage', 'friendship', 'animals'],
    language: 'en',
    region: 'US',
    audioUrl: 'https://cdn.example.com/audio/brave-mouse.mp3',
    imageUrl: 'https://cdn.example.com/images/brave-mouse.jpg',
    isFeatured: true,
    popularityScore: 4.7,
    metadata: {
      keyValue: 'Courage',
      summary: 'An inspiring tale about bravery and helping others.'
    }
  },
  {
    type: 'meditation',
    title: 'Ocean Waves Relaxation',
    description: 'A calming meditation with gentle ocean sounds to help children relax and unwind.',
    durationSec: 600,
    ageRange: '3-5',
    tags: ['meditation', 'relaxation', 'ocean', 'calm'],
    language: 'en',
    region: 'US',
    audioUrl: 'https://cdn.example.com/audio/ocean-waves.mp3',
    imageUrl: 'https://cdn.example.com/images/ocean-waves.jpg',
    isFeatured: false,
    popularityScore: 4.5,
    metadata: {
      keyValue: 'Relaxation',
      summary: 'Peaceful ocean sounds for meditation and relaxation.'
    }
  },
  {
    type: 'story',
    title: 'The Magic Garden',
    description: 'Discover a secret garden where flowers sing and butterflies dance in this enchanting tale.',
    durationSec: 840,
    ageRange: '6-8',
    tags: ['magic', 'garden', 'nature', 'wonder'],
    language: 'en',
    region: 'US',
    audioUrl: 'https://cdn.example.com/audio/magic-garden.mp3',
    imageUrl: 'https://cdn.example.com/images/magic-garden.jpg',
    isFeatured: true,
    popularityScore: 4.9,
    metadata: {
      keyValue: 'Wonder',
      summary: 'A magical story about discovering the beauty of nature.'
    }
  },
  {
    type: 'affirmation',
    title: 'I Am Brave and Strong',
    description: 'Positive affirmations to help children build confidence and self-esteem.',
    durationSec: 300,
    ageRange: '9-12',
    tags: ['affirmation', 'confidence', 'self-esteem', 'positive'],
    language: 'en',
    region: 'US',
    audioUrl: 'https://cdn.example.com/audio/brave-strong.mp3',
    imageUrl: 'https://cdn.example.com/images/brave-strong.jpg',
    isFeatured: false,
    popularityScore: 4.3,
    metadata: {
      keyValue: 'Confidence',
      summary: 'Empowering affirmations for building self-confidence.'
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data (optional - comment out if you want to keep existing data)
    await Avatar.deleteMany({});
    await Category.deleteMany({});
    await Content.deleteMany({});
    logger.info('Cleared existing data');

    // Seed Avatars
    const avatars = await Avatar.insertMany(sampleAvatars);
    logger.info(`Seeded ${avatars.length} avatars`);

    // Seed Categories
    const categories = await Category.insertMany(sampleCategories);
    logger.info(`Seeded ${categories.length} categories`);

    // Seed Content
    const content = await Content.insertMany(sampleContent);
    logger.info(`Seeded ${content.length} content items`);

    logger.info('Database seeding completed successfully!');
    
    // Display summary
    console.log('\n🌱 Database Seeding Summary:');
    console.log(`✅ ${avatars.length} avatars created`);
    console.log(`✅ ${categories.length} categories created`);
    console.log(`✅ ${content.length} content items created`);
    console.log('\n🎉 Seeding completed successfully!');
    
  } catch (error) {
    logger.error('Database seeding failed:', error);
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
