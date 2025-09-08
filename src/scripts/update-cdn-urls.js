#!/usr/bin/env node

/**
 * Script to update existing content with proper CDN URLs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Content = require('../models/Content');

// CDN configuration
const CDN_BASE_URL = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN 
  ? `https://${process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN}`
  : 'https://d1ta1qd8y4woyq.cloudfront.net';

// Function to convert relative URL to CDN URL
const toCDNUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http')) return url; // Already absolute URL
  if (url.startsWith('/assets/')) {
    return `${CDN_BASE_URL}${url}`;
  }
  return url;
};

// Function to update asset mappings with CDN URLs
function getUpdatedAssetMappings() {
  return {
    'buddha-and-angulimala': {
      en: {
        title: 'Buddha and Angulimala',
        description: 'A story about compassion and transformation, where Buddha helps a feared bandit find peace.',
        audioUrl: `${CDN_BASE_URL}/assets/Buddha and Angulimala.mp3`,
        imageUrl: `${CDN_BASE_URL}/assets/English_buddha (1).png`,
        thumbnailUrl: `${CDN_BASE_URL}/assets/English_buddha (1).png`,
        metadata: {
          keyValue: 'Compassion',
          summary: 'Through this powerful tale, children learn that everyone can change and find peace through compassion and understanding.'
        }
      },
      hi: {
        title: 'बुद्ध और अंगुलिमाल',
        description: 'करुणा और परिवर्तन की कहानी, जहाँ बुद्ध एक डरावने डाकू को शांति पाने में मदद करते हैं।',
        audioUrl: `${CDN_BASE_URL}/assets/ElevenLabs_buddha_and_angulimala.mp3`,
        imageUrl: `${CDN_BASE_URL}/assets/Hindi.png`,
        thumbnailUrl: `${CDN_BASE_URL}/assets/Hindi.png`,
        metadata: {
          keyValue: 'करुणा',
          summary: 'इस शक्तिशाली कहानी के माध्यम से, बच्चे सीखते हैं कि हर कोई बदल सकता है और करुणा और समझ के माध्यम से शांति पा सकता है।'
        }
      }
    },
    'the-brahmin-and-three-crooks': {
      en: {
        title: 'The Brahmin and Three Crooks',
        description: 'A wise tale about how cleverness and deception can be overcome by wisdom and discernment.',
        audioUrl: `${CDN_BASE_URL}/assets/ElevenLabs_The_Brahmin_and_the_Crooks_english.mp3`,
        imageUrl: `${CDN_BASE_URL}/assets/English_bhramin.png`,
        thumbnailUrl: `${CDN_BASE_URL}/assets/English_bhramin.png`,
        metadata: {
          keyValue: 'Wisdom',
          summary: 'This story teaches children the importance of thinking carefully and not being easily fooled by others.'
        }
      },
      hi: {
        title: 'ब्राह्मण और तीन ठग',
        description: 'एक बुद्धिमानी की कहानी जो बताती है कि कैसे चालाकी और धोखे को बुद्धि और विवेक से हराया जा सकता है।',
        audioUrl: `${CDN_BASE_URL}/assets/ElevenLabs_brahmin_and_crooks_-_hindi.mp3`,
        imageUrl: `${CDN_BASE_URL}/assets/Hindi_bhraman.png`,
        thumbnailUrl: `${CDN_BASE_URL}/assets/Hindi_bhraman.png`,
        metadata: {
          keyValue: 'बुद्धि',
          summary: 'यह कहानी बच्चों को सिखाती है कि सोच-समझकर काम करना और दूसरों से आसानी से धोखा न खाना कितना महत्वपूर्ण है।'
        }
      }
    }
  };
}

/**
 * Update existing content with CDN URLs
 */
async function updateContentWithCDNUrls() {
  console.log('\n🔄 Updating content with CDN URLs...');

  try {
    const contents = await Content.find({});
    const ASSET_MAPPINGS = getUpdatedAssetMappings();
    let updated = 0;

    for (const content of contents) {
      let hasUpdates = false;

      // Check if we have predefined mappings for this content
      if (ASSET_MAPPINGS[content.slug]) {
        console.log(`📝 Updating CDN URLs for: ${content.title}`);
        
        // Update language-specific content with CDN URLs
        if (content.languages) {
          content.languages['en'] = ASSET_MAPPINGS[content.slug].en;
          content.languages['hi'] = ASSET_MAPPINGS[content.slug].hi;
          hasUpdates = true;
        }
      } else {
        // Update any relative URLs in the base content
        if (content.audioUrl && content.audioUrl.startsWith('/assets/')) {
          content.audioUrl = toCDNUrl(content.audioUrl);
          hasUpdates = true;
        }
        if (content.imageUrl && content.imageUrl.startsWith('/assets/')) {
          content.imageUrl = toCDNUrl(content.imageUrl);
          hasUpdates = true;
        }
        if (content.thumbnailUrl && content.thumbnailUrl.startsWith('/assets/')) {
          content.thumbnailUrl = toCDNUrl(content.thumbnailUrl);
          hasUpdates = true;
        }

        // Update language-specific content URLs
        if (content.languages) {
          for (const [lang, langContent] of Object.entries(content.languages)) {
            if (langContent.audioUrl && langContent.audioUrl.startsWith('/assets/')) {
              langContent.audioUrl = toCDNUrl(langContent.audioUrl);
              hasUpdates = true;
            }
            if (langContent.imageUrl && langContent.imageUrl.startsWith('/assets/')) {
              langContent.imageUrl = toCDNUrl(langContent.imageUrl);
              hasUpdates = true;
            }
            if (langContent.thumbnailUrl && langContent.thumbnailUrl.startsWith('/assets/')) {
              langContent.thumbnailUrl = toCDNUrl(langContent.thumbnailUrl);
              hasUpdates = true;
            }
          }
        }
      }

      if (hasUpdates) {
        await content.save();
        updated++;
        console.log(`✅ Updated: ${content.title}`);
      }
    }

    console.log(`\n📊 CDN URL Update Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Total: ${contents.length}`);

  } catch (error) {
    console.error('❌ Error updating CDN URLs:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting CDN URL update...');
    console.log(`📡 CDN Base URL: ${CDN_BASE_URL}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update content with CDN URLs
    await updateContentWithCDNUrls();

    console.log('\n🎉 CDN URL update completed successfully!');

  } catch (error) {
    console.error('💥 CDN URL update failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
