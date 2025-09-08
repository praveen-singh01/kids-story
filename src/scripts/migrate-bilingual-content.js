const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import models
const { Content } = require('../models');

// Configuration
const SUPPORTED_LANGUAGES = ['en', 'hi'];
const ASSETS_PATH = path.join(__dirname, '../../assets');

// Language mappings for the existing assets
const ASSET_MAPPINGS = {
  'buddha-and-angulimala': {
    en: {
      title: 'Buddha and Angulimala',
      description: 'A story about compassion and transformation, where Buddha helps a feared bandit find peace.',
      audioUrl: '/assets/Buddha and Angulimala.mp3',
      imageUrl: '/assets/English_buddha (1).png',
      thumbnailUrl: '/assets/English_buddha (1).png',
      metadata: {
        keyValue: 'Compassion',
        summary: 'Through this powerful tale, children learn that everyone can change and find peace through compassion and understanding.'
      }
    },
    hi: {
      title: 'बुद्ध और अंगुलिमाल',
      description: 'करुणा और परिवर्तन की कहानी, जहाँ बुद्ध एक डरावने डाकू को शांति पाने में मदद करते हैं।',
      audioUrl: '/assets/ElevenLabs_buddha_and_angulimala.mp3',
      imageUrl: '/assets/Hindi.png',
      thumbnailUrl: '/assets/Hindi.png',
      metadata: {
        keyValue: 'करुणा',
        summary: 'इस शक्तिशाली कहानी के माध्यम से, बच्चे सीखते हैं कि हर कोई बदल सकता है और करुणा और समझ के माध्यम से शांति पा सकता है।'
      }
    }
  },
  'brahmin-and-three-crooks': {
    en: {
      title: 'The Brahmin and Three Crooks',
      description: 'A wise tale about how cleverness and deception can be overcome by wisdom and discernment.',
      audioUrl: '/assets/ElevenLabs_The_Brahmin_and_the_Crooks_english.mp3',
      imageUrl: '/assets/English_bhramin.png',
      thumbnailUrl: '/assets/English_bhramin.png',
      metadata: {
        keyValue: 'Wisdom',
        summary: 'This story teaches children the importance of thinking carefully and not being easily fooled by others.'
      }
    },
    hi: {
      title: 'ब्राह्मण और तीन ठग',
      description: 'एक बुद्धिमानी की कहानी जो बताती है कि कैसे चालाकी और धोखे को बुद्धि और विवेक से हराया जा सकता है।',
      audioUrl: '/assets/ElevenLabs_brahmin_and_crooks_-_hindi.mp3',
      imageUrl: '/assets/Hindi_bhraman.png',
      thumbnailUrl: '/assets/Hindi_bhraman.png',
      metadata: {
        keyValue: 'बुद्धि',
        summary: 'यह कहानी बच्चों को सिखाती है कि सोच-समझकर काम करना और दूसरों से आसानी से धोखा न खाना कितना महत्वपूर्ण है।'
      }
    }
  }
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kids-story-app');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Check if assets exist
 */
function checkAssets() {
  console.log('\n📁 Checking assets...');
  
  const requiredAssets = [
    'Buddha and Angulimala.mp3',
    'ElevenLabs_buddha_and_angulimala.mp3',
    'English_buddha (1).png',
    'Hindi.png',
    'ElevenLabs_The_Brahmin_and_the_Crooks_english.mp3',
    'ElevenLabs_brahmin_and_crooks_-_hindi.mp3',
    'English_bhramin.png',
    'Hindi_bhraman.png'
  ];

  const missingAssets = [];
  
  for (const asset of requiredAssets) {
    const assetPath = path.join(ASSETS_PATH, asset);
    if (!fs.existsSync(assetPath)) {
      missingAssets.push(asset);
    } else {
      console.log(`✅ Found: ${asset}`);
    }
  }

  if (missingAssets.length > 0) {
    console.warn('⚠️  Missing assets:', missingAssets);
    console.log('Migration will continue, but you may need to update asset URLs manually.');
  }

  return missingAssets.length === 0;
}

/**
 * Migrate existing content to bilingual structure
 */
async function migrateExistingContent() {
  console.log('\n🔄 Migrating existing content...');
  
  try {
    // Find all existing content
    const existingContent = await Content.find({});
    console.log(`Found ${existingContent.length} existing content items`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const content of existingContent) {
      // Skip if already has language structure
      if (content.languages && Object.keys(content.languages).length > 0) {
        console.log(`⏭️  Skipping ${content.title} - already has language structure`);
        skippedCount++;
        continue;
      }

      // Initialize language structure
      content.languages = {};
      content.defaultLanguage = 'en';
      content.availableLanguages = ['en'];

      // Set English content from existing fields
      const englishContent = {
        title: content.title,
        description: content.description || '',
        audioUrl: content.audioUrl,
        imageUrl: content.imageUrl,
        thumbnailUrl: content.thumbnailUrl,
        metadata: content.metadata || {}
      };

      content.languages['en'] = englishContent;

      // Check if we have predefined mappings for this content
      const slug = content.slug;
      if (ASSET_MAPPINGS[slug]) {
        console.log(`📝 Applying predefined mappings for: ${content.title}`);
        
        // Update English content with better data
        if (ASSET_MAPPINGS[slug].en) {
          content.languages['en'] = ASSET_MAPPINGS[slug].en;
        }

        // Add Hindi content if available
        if (ASSET_MAPPINGS[slug].hi) {
          content.languages['hi'] = ASSET_MAPPINGS[slug].hi;
          content.availableLanguages.push('hi');
        }
      }

      // Save the updated content
      await content.save();
      console.log(`✅ Migrated: ${content.title}`);
      migratedCount++;
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${existingContent.length}`);

  } catch (error) {
    console.error('❌ Error migrating content:', error);
    throw error;
  }
}

/**
 * Create sample bilingual content
 */
async function createSampleContent() {
  console.log('\n🆕 Creating sample bilingual content...');

  try {
    const stories = [
      {
        slug: 'buddha-and-angulimala',
        data: {
          type: 'story',
          title: 'Buddha and Angulimala',
          description: 'A story about compassion and transformation',
          durationSec: 480, // 8 minutes
          ageRange: '6-8',
          tags: ['wisdom', 'compassion', 'transformation'],
          defaultLanguage: 'en',
          availableLanguages: ['en', 'hi'],
          isFeatured: true,
          popularityScore: 4.5
        }
      },
      {
        slug: 'brahmin-and-three-crooks',
        data: {
          type: 'story',
          title: 'The Brahmin and Three Crooks',
          description: 'A wise tale about cleverness and deception',
          durationSec: 420, // 7 minutes
          ageRange: '6-8',
          tags: ['wisdom', 'cleverness', 'moral'],
          defaultLanguage: 'en',
          availableLanguages: ['en', 'hi'],
          isFeatured: true,
          popularityScore: 4.3
        }
      }
    ];

    for (const story of stories) {
      // Check if story already exists
      const existingStory = await Content.findOne({ slug: story.slug });

      if (existingStory) {
        console.log(`⏭️  ${story.data.title} already exists, skipping creation`);
        continue;
      }

      // Create the bilingual story
      const bilingualStory = new Content(story.data);

      // Set language-specific content
      bilingualStory.languages = {};
      bilingualStory.languages['en'] = ASSET_MAPPINGS[story.slug].en;
      bilingualStory.languages['hi'] = ASSET_MAPPINGS[story.slug].hi;

      await bilingualStory.save();
      console.log(`✅ Created sample bilingual story: ${story.data.title}`);
    }

  } catch (error) {
    console.error('❌ Error creating sample content:', error);
    throw error;
  }
}

/**
 * Validate migration results
 */
async function validateMigration() {
  console.log('\n🔍 Validating migration...');

  try {
    const totalContent = await Content.countDocuments({});
    const bilingualContent = await Content.countDocuments({
      'languages.en': { $exists: true }
    });
    const hindiContent = await Content.countDocuments({
      availableLanguages: 'hi'
    });

    console.log(`📊 Validation Results:`);
    console.log(`   Total content: ${totalContent}`);
    console.log(`   Content with English: ${bilingualContent}`);
    console.log(`   Content with Hindi: ${hindiContent}`);

    // Test language retrieval
    const sampleContent = await Content.findOne({ availableLanguages: 'hi' });
    if (sampleContent) {
      console.log(`\n🧪 Testing language retrieval:`);
      console.log(`   English title: ${sampleContent.getLanguageContent('en').title}`);
      console.log(`   Hindi title: ${sampleContent.getLanguageContent('hi').title}`);
    }

    console.log('\n✅ Migration validation completed successfully!');

  } catch (error) {
    console.error('❌ Error validating migration:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting bilingual content migration...\n');

  try {
    // Connect to database
    await connectDB();

    // Check assets
    checkAssets();

    // Migrate existing content
    await migrateExistingContent();

    // Create sample content
    await createSampleContent();

    // Validate migration
    await validateMigration();

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  migrateExistingContent,
  createSampleContent,
  validateMigration
};
