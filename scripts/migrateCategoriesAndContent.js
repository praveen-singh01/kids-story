const mongoose = require('mongoose');
const config = require('../src/config');
const { Content, Category } = require('../src/models');
const logger = require('../src/utils/logger');

/**
 * Migration script to add categories and update existing content
 * This script:
 * 1. Creates default categories based on existing content types
 * 2. Updates existing content to reference appropriate categories
 * 3. Updates category content counts
 */

// Default categories to create
const defaultCategories = [
  {
    name: 'Stories',
    description: 'Bedtime stories and fairy tales for children',
    slug: 'stories',
    metadata: {
      color: '#8B5CF6',
      icon: 'book-open',
    },
    sortOrder: 1,
  },
  {
    name: 'Affirmations',
    description: 'Positive affirmations to build confidence and self-esteem',
    slug: 'affirmations',
    metadata: {
      color: '#10B981',
      icon: 'heart',
    },
    sortOrder: 2,
  },
  {
    name: 'Meditations',
    description: 'Guided meditations for relaxation and mindfulness',
    slug: 'meditations',
    metadata: {
      color: '#3B82F6',
      icon: 'sparkles',
    },
    sortOrder: 3,
  },
  {
    name: 'Music',
    description: 'Soothing music and lullabies for peaceful sleep',
    slug: 'music',
    metadata: {
      color: '#F59E0B',
      icon: 'musical-note',
    },
    sortOrder: 4,
  },
  {
    name: 'General',
    description: 'General content that doesn\'t fit into other categories',
    slug: 'general',
    metadata: {
      color: '#6B7280',
      icon: 'folder',
    },
    sortOrder: 5,
  },
];

// Mapping from content type to category slug
const typeToCategory = {
  'story': 'stories',
  'affirmation': 'affirmations',
  'meditation': 'meditations',
  'music': 'music',
};

async function connectToDatabase() {
  try {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB for migration');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function createDefaultCategories() {
  logger.info('Creating default categories...');
  
  const createdCategories = {};
  
  for (const categoryData of defaultCategories) {
    try {
      // Check if category already exists
      const existingCategory = await Category.findOne({ slug: categoryData.slug });
      
      if (existingCategory) {
        logger.info(`Category '${categoryData.name}' already exists, skipping...`);
        createdCategories[categoryData.slug] = existingCategory;
        continue;
      }
      
      // Create new category
      const category = new Category(categoryData);
      await category.save();
      
      createdCategories[categoryData.slug] = category;
      logger.info(`Created category: ${categoryData.name} (${categoryData.slug})`);
    } catch (error) {
      logger.error(`Failed to create category '${categoryData.name}':`, error);
      throw error;
    }
  }
  
  return createdCategories;
}

async function updateExistingContent(categories) {
  logger.info('Updating existing content with category references...');
  
  // Get all content without categoryId
  const contentWithoutCategory = await Content.find({ 
    categoryId: { $exists: false } 
  });
  
  logger.info(`Found ${contentWithoutCategory.length} content items to update`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const content of contentWithoutCategory) {
    try {
      // Determine category based on content type
      const categorySlug = typeToCategory[content.type] || 'general';
      const category = categories[categorySlug];
      
      if (!category) {
        logger.warn(`No category found for type '${content.type}', using general category`);
        continue;
      }
      
      // Update content with categoryId
      await Content.findByIdAndUpdate(content._id, {
        categoryId: category._id,
      });
      
      updatedCount++;
      
      if (updatedCount % 100 === 0) {
        logger.info(`Updated ${updatedCount} content items...`);
      }
    } catch (error) {
      logger.error(`Failed to update content '${content.title}' (${content._id}):`, error);
      errorCount++;
    }
  }
  
  logger.info(`Content update completed: ${updatedCount} updated, ${errorCount} errors`);
  return { updatedCount, errorCount };
}

async function updateCategoryContentCounts(categories) {
  logger.info('Updating category content counts...');
  
  for (const [slug, category] of Object.entries(categories)) {
    try {
      const contentCount = await Content.countDocuments({
        categoryId: category._id,
        isActive: true,
      });
      
      await Category.findByIdAndUpdate(category._id, {
        contentCount: contentCount,
      });
      
      logger.info(`Updated category '${category.name}' content count: ${contentCount}`);
    } catch (error) {
      logger.error(`Failed to update content count for category '${category.name}':`, error);
    }
  }
}

async function createIndexes() {
  logger.info('Creating database indexes...');
  
  try {
    // Content indexes
    await Content.collection.createIndex({ categoryId: 1, isActive: 1 });
    await Content.collection.createIndex({ categoryId: 1, type: 1, ageRange: 1 });
    await Content.collection.createIndex({ categoryId: 1, isFeatured: -1, popularityScore: -1 });
    
    // Category indexes
    await Category.collection.createIndex({ slug: 1 }, { unique: true });
    await Category.collection.createIndex({ isActive: 1, sortOrder: 1 });
    await Category.collection.createIndex({ name: 'text', description: 'text' });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.warn('Some indexes may already exist:', error.message);
  }
}

async function runMigration() {
  try {
    logger.info('Starting category and content migration...');
    
    // Connect to database
    await connectToDatabase();
    
    // Create default categories
    const categories = await createDefaultCategories();
    
    // Update existing content
    const updateResult = await updateExistingContent(categories);
    
    // Update category content counts
    await updateCategoryContentCounts(categories);
    
    // Create database indexes
    await createIndexes();
    
    logger.info('Migration completed successfully!');
    logger.info(`Summary:
      - Categories created: ${Object.keys(categories).length}
      - Content items updated: ${updateResult.updatedCount}
      - Errors: ${updateResult.errorCount}
    `);
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  createDefaultCategories,
  updateExistingContent,
  updateCategoryContentCounts,
};
