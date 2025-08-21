const mongoose = require('mongoose');
const config = require('../src/config');
const { Content, Highlight } = require('../src/models');
const logger = require('../src/utils/logger');

// Sample content data
const contentData = [
  // Stories
  {
    type: 'story',
    title: 'The Sleepy Forest',
    slug: 'the-sleepy-forest',
    durationSec: 480,
    ageRange: '3-5',
    tags: ['folk_tales', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/stories/the-sleepy-forest.mp3',
    imageUrl: '/images/stories/the-sleepy-forest.jpg',
    isFeatured: true,
    popularityScore: 85,
  },
  {
    type: 'story',
    title: 'The Magic Pillow',
    slug: 'the-magic-pillow',
    durationSec: 360,
    ageRange: '6-8',
    tags: ['fantasy', 'adventure'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/stories/the-magic-pillow.mp3',
    imageUrl: '/images/stories/the-magic-pillow.jpg',
    isFeatured: false,
    popularityScore: 72,
  },
  {
    type: 'story',
    title: 'The Wise Old Owl',
    slug: 'the-wise-old-owl',
    durationSec: 420,
    ageRange: '9-12',
    tags: ['educational', 'folk_tales'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/stories/the-wise-old-owl.mp3',
    imageUrl: '/images/stories/the-wise-old-owl.jpg',
    isFeatured: true,
    popularityScore: 91,
  },
  {
    type: 'story',
    title: 'The Gentle Giant',
    slug: 'the-gentle-giant',
    durationSec: 540,
    ageRange: '6-8',
    tags: ['adventure', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/stories/the-gentle-giant.mp3',
    imageUrl: '/images/stories/the-gentle-giant.jpg',
    isFeatured: false,
    popularityScore: 68,
  },
  {
    type: 'story',
    title: 'The Moonbeam Express',
    slug: 'the-moonbeam-express',
    durationSec: 600,
    ageRange: '3-5',
    tags: ['fantasy', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/stories/the-moonbeam-express.mp3',
    imageUrl: '/images/stories/the-moonbeam-express.jpg',
    isFeatured: false,
    popularityScore: 79,
  },
  {
    type: 'story',
    title: 'The Secret Garden',
    slug: 'the-secret-garden',
    durationSec: 720,
    ageRange: '9-12',
    tags: ['adventure', 'educational'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/stories/the-secret-garden.mp3',
    imageUrl: '/images/stories/the-secret-garden.jpg',
    isFeatured: false,
    popularityScore: 83,
  },
  {
    type: 'story',
    title: 'The Sleepy Dragon',
    slug: 'the-sleepy-dragon',
    durationSec: 450,
    ageRange: '6-8',
    tags: ['fantasy', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/stories/the-sleepy-dragon.mp3',
    imageUrl: '/images/stories/the-sleepy-dragon.jpg',
    isFeatured: true,
    popularityScore: 88,
  },
  {
    type: 'story',
    title: 'The Starlight Adventure',
    slug: 'the-starlight-adventure',
    durationSec: 390,
    ageRange: '3-5',
    tags: ['adventure', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/stories/the-starlight-adventure.mp3',
    imageUrl: '/images/stories/the-starlight-adventure.jpg',
    isFeatured: false,
    popularityScore: 76,
  },

  // Affirmations
  {
    type: 'affirmation',
    title: 'I Am Brave and Strong',
    slug: 'i-am-brave-and-strong',
    durationSec: 180,
    ageRange: '3-5',
    tags: ['affirmations', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/affirmations/i-am-brave-and-strong.mp3',
    imageUrl: '/images/affirmations/i-am-brave-and-strong.jpg',
    isFeatured: false,
    popularityScore: 65,
  },
  {
    type: 'affirmation',
    title: 'Peaceful Dreams',
    slug: 'peaceful-dreams',
    durationSec: 240,
    ageRange: '6-8',
    tags: ['affirmations', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/affirmations/peaceful-dreams.mp3',
    imageUrl: '/images/affirmations/peaceful-dreams.jpg',
    isFeatured: true,
    popularityScore: 82,
  },
  {
    type: 'affirmation',
    title: 'Confidence and Joy',
    slug: 'confidence-and-joy',
    durationSec: 300,
    ageRange: '9-12',
    tags: ['affirmations', 'educational'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/affirmations/confidence-and-joy.mp3',
    imageUrl: '/images/affirmations/confidence-and-joy.jpg',
    isFeatured: false,
    popularityScore: 71,
  },
  {
    type: 'affirmation',
    title: 'Sweet Dreams Tonight',
    slug: 'sweet-dreams-tonight',
    durationSec: 200,
    ageRange: '3-5',
    tags: ['affirmations', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/affirmations/sweet-dreams-tonight.mp3',
    imageUrl: '/images/affirmations/sweet-dreams-tonight.jpg',
    isFeatured: false,
    popularityScore: 69,
  },
  {
    type: 'affirmation',
    title: 'I Am Loved',
    slug: 'i-am-loved',
    durationSec: 220,
    ageRange: '6-8',
    tags: ['affirmations', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/affirmations/i-am-loved.mp3',
    imageUrl: '/images/affirmations/i-am-loved.jpg',
    isFeatured: false,
    popularityScore: 78,
  },
  {
    type: 'affirmation',
    title: 'Tomorrow Will Be Great',
    slug: 'tomorrow-will-be-great',
    durationSec: 260,
    ageRange: '9-12',
    tags: ['affirmations', 'educational'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/affirmations/tomorrow-will-be-great.mp3',
    imageUrl: '/images/affirmations/tomorrow-will-be-great.jpg',
    isFeatured: false,
    popularityScore: 73,
  },
  {
    type: 'affirmation',
    title: 'Calm and Peaceful',
    slug: 'calm-and-peaceful',
    durationSec: 180,
    ageRange: '3-5',
    tags: ['affirmations', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/affirmations/calm-and-peaceful.mp3',
    imageUrl: '/images/affirmations/calm-and-peaceful.jpg',
    isFeatured: true,
    popularityScore: 80,
  },
  {
    type: 'affirmation',
    title: 'Ready for Sleep',
    slug: 'ready-for-sleep',
    durationSec: 210,
    ageRange: '6-8',
    tags: ['affirmations', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/affirmations/ready-for-sleep.mp3',
    imageUrl: '/images/affirmations/ready-for-sleep.jpg',
    isFeatured: false,
    popularityScore: 75,
  },

  // Meditations
  {
    type: 'meditation',
    title: 'Ocean Waves Meditation',
    slug: 'ocean-waves-meditation',
    durationSec: 600,
    ageRange: '6-8',
    tags: ['meditations', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/meditations/ocean-waves-meditation.mp3',
    imageUrl: '/images/meditations/ocean-waves-meditation.jpg',
    isFeatured: true,
    popularityScore: 87,
  },
  {
    type: 'meditation',
    title: 'Forest Sounds',
    slug: 'forest-sounds',
    durationSec: 720,
    ageRange: '9-12',
    tags: ['meditations', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/meditations/forest-sounds.mp3',
    imageUrl: '/images/meditations/forest-sounds.jpg',
    isFeatured: false,
    popularityScore: 84,
  },
  {
    type: 'meditation',
    title: 'Gentle Rain',
    slug: 'gentle-rain',
    durationSec: 480,
    ageRange: '3-5',
    tags: ['meditations', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/meditations/gentle-rain.mp3',
    imageUrl: '/images/meditations/gentle-rain.jpg',
    isFeatured: false,
    popularityScore: 81,
  },
  {
    type: 'meditation',
    title: 'Breathing with the Stars',
    slug: 'breathing-with-the-stars',
    durationSec: 360,
    ageRange: '6-8',
    tags: ['meditations', 'educational'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/meditations/breathing-with-the-stars.mp3',
    imageUrl: '/images/meditations/breathing-with-the-stars.jpg',
    isFeatured: false,
    popularityScore: 77,
  },

  // Music
  {
    type: 'music',
    title: 'Lullaby Dreams',
    slug: 'lullaby-dreams',
    durationSec: 900,
    ageRange: '3-5',
    tags: ['music', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/music/lullaby-dreams.mp3',
    imageUrl: '/images/music/lullaby-dreams.jpg',
    isFeatured: true,
    popularityScore: 92,
  },
  {
    type: 'music',
    title: 'Sleepy Time Piano',
    slug: 'sleepy-time-piano',
    durationSec: 1200,
    ageRange: '6-8',
    tags: ['music', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/music/sleepy-time-piano.mp3',
    imageUrl: '/images/music/sleepy-time-piano.jpg',
    isFeatured: false,
    popularityScore: 89,
  },
  {
    type: 'music',
    title: 'Nature Symphony',
    slug: 'nature-symphony',
    durationSec: 1080,
    ageRange: '9-12',
    tags: ['music', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/music/nature-symphony.mp3',
    imageUrl: '/images/music/nature-symphony.jpg',
    isFeatured: false,
    popularityScore: 86,
  },
  {
    type: 'music',
    title: 'Soft Guitar Melodies',
    slug: 'soft-guitar-melodies',
    durationSec: 840,
    ageRange: '6-8',
    tags: ['music', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/music/soft-guitar-melodies.mp3',
    imageUrl: '/images/music/soft-guitar-melodies.jpg',
    isFeatured: false,
    popularityScore: 83,
  },
  {
    type: 'music',
    title: 'Peaceful Harp',
    slug: 'peaceful-harp',
    durationSec: 960,
    ageRange: '3-5',
    tags: ['music', 'calming'],
    language: 'en',
    region: 'US',
    audioUrl: '/audio/music/peaceful-harp.mp3',
    imageUrl: '/images/music/peaceful-harp.jpg',
    isFeatured: true,
    popularityScore: 90,
  },
];

// Highlight data for current week
const highlightData = {
  title: 'Weekly Favorites',
  subtitle: 'Hand-picked stories and sounds for peaceful sleep',
  startsAt: new Date(),
  endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  isActive: true,
  priority: 1,
};

async function seedContent() {
  try {
    logger.info('Starting content seeding...');

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB');

    // Clear existing content and highlights
    await Content.deleteMany({});
    await Highlight.deleteMany({});
    logger.info('Cleared existing content and highlights');

    // Insert content
    const insertedContent = await Content.insertMany(contentData);
    logger.info(`Inserted ${insertedContent.length} content items`);

    // Create highlight with some featured content
    const featuredContent = insertedContent.filter(content => content.isFeatured);
    const highlightContentIds = featuredContent.slice(0, 5).map(content => content._id);

    const highlight = new Highlight({
      ...highlightData,
      contentIds: highlightContentIds,
    });

    await highlight.save();
    logger.info('Created weekly highlight');

    // Log summary
    const contentStats = await Content.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgPopularity: { $avg: '$popularityScore' },
        },
      },
    ]);

    logger.info('Content seeding completed successfully!');
    logger.info('Content statistics:', contentStats);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding content:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedContent();
}

module.exports = seedContent;
