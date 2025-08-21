const mongoose = require('mongoose');
const config = require('../src/config');
const logger = require('../src/utils/logger');

/**
 * Migration runner
 * Add migration functions here as needed
 */

const migrations = [
  {
    version: '1.0.0',
    description: 'Initial database setup',
    up: async () => {
      logger.info('Running initial database setup...');
      
      // Create indexes if they don't exist
      const db = mongoose.connection.db;
      
      // Users collection indexes
      try {
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ provider: 1, googleId: 1 });
        await db.collection('users').createIndex({ 'subscription.status': 1 });
        logger.info('Created users indexes');
      } catch (error) {
        logger.warn('Users indexes may already exist:', error.message);
      }
      
      // Kid profiles indexes
      try {
        await db.collection('kidprofiles').createIndex({ userId: 1 });
        await db.collection('kidprofiles').createIndex({ userId: 1, name: 1 });
        await db.collection('kidprofiles').createIndex({ ageRange: 1 });
        logger.info('Created kidprofiles indexes');
      } catch (error) {
        logger.warn('KidProfiles indexes may already exist:', error.message);
      }
      
      // Content indexes
      try {
        await db.collection('contents').createIndex({ slug: 1 }, { unique: true });
        await db.collection('contents').createIndex({ type: 1, ageRange: 1 });
        await db.collection('contents').createIndex({ type: 1, tags: 1 });
        await db.collection('contents').createIndex({ 
          isFeatured: -1, 
          popularityScore: -1, 
          publishedAt: -1 
        });
        await db.collection('contents').createIndex({ 
          title: 'text', 
          tags: 'text' 
        });
        logger.info('Created contents indexes');
      } catch (error) {
        logger.warn('Contents indexes may already exist:', error.message);
      }
      
      // Favorites indexes
      try {
        await db.collection('favorites').createIndex(
          { kidId: 1, contentId: 1 }, 
          { unique: true }
        );
        await db.collection('favorites').createIndex({ userId: 1, kidId: 1 });
        logger.info('Created favorites indexes');
      } catch (error) {
        logger.warn('Favorites indexes may already exist:', error.message);
      }
      
      // Highlights indexes
      try {
        await db.collection('highlights').createIndex({ startsAt: 1, endsAt: 1 });
        await db.collection('highlights').createIndex({ 
          isActive: 1, 
          startsAt: 1, 
          endsAt: 1 
        });
        logger.info('Created highlights indexes');
      } catch (error) {
        logger.warn('Highlights indexes may already exist:', error.message);
      }
      
      // Payment events indexes
      try {
        await db.collection('paymentevents').createIndex(
          { eventId: 1 }, 
          { unique: true }
        );
        await db.collection('paymentevents').createIndex({ userId: 1, type: 1 });
        await db.collection('paymentevents').createIndex({ 
          processed: 1, 
          receivedAt: 1 
        });
        logger.info('Created paymentevents indexes');
      } catch (error) {
        logger.warn('PaymentEvents indexes may already exist:', error.message);
      }
      
      logger.info('Initial database setup completed');
    },
    down: async () => {
      logger.info('Rolling back initial database setup...');
      // Add rollback logic if needed
      logger.info('Rollback completed');
    },
  },
  
  // Add more migrations here as needed
  // {
  //   version: '1.1.0',
  //   description: 'Add new field to users',
  //   up: async () => {
  //     // Migration logic
  //   },
  //   down: async () => {
  //     // Rollback logic
  //   },
  // },
];

/**
 * Run migrations
 */
async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB');
    
    // Create migrations collection if it doesn't exist
    const db = mongoose.connection.db;
    const migrationsCollection = db.collection('migrations');
    
    // Get completed migrations
    const completedMigrations = await migrationsCollection.find({}).toArray();
    const completedVersions = completedMigrations.map(m => m.version);
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!completedVersions.includes(migration.version)) {
        logger.info(`Running migration ${migration.version}: ${migration.description}`);
        
        try {
          await migration.up();
          
          // Record successful migration
          await migrationsCollection.insertOne({
            version: migration.version,
            description: migration.description,
            appliedAt: new Date(),
          });
          
          logger.info(`Migration ${migration.version} completed successfully`);
        } catch (error) {
          logger.error(`Migration ${migration.version} failed:`, error);
          throw error;
        }
      } else {
        logger.info(`Migration ${migration.version} already applied, skipping`);
      }
    }
    
    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Rollback last migration
 */
async function rollbackMigration() {
  try {
    logger.info('Rolling back last migration...');
    
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const migrationsCollection = db.collection('migrations');
    
    // Get last migration
    const lastMigration = await migrationsCollection
      .findOne({}, { sort: { appliedAt: -1 } });
    
    if (!lastMigration) {
      logger.info('No migrations to rollback');
      process.exit(0);
    }
    
    // Find migration definition
    const migrationDef = migrations.find(m => m.version === lastMigration.version);
    
    if (!migrationDef) {
      logger.error(`Migration definition not found for version ${lastMigration.version}`);
      process.exit(1);
    }
    
    logger.info(`Rolling back migration ${migrationDef.version}: ${migrationDef.description}`);
    
    // Run rollback
    await migrationDef.down();
    
    // Remove migration record
    await migrationsCollection.deleteOne({ version: lastMigration.version });
    
    logger.info(`Migration ${migrationDef.version} rolled back successfully`);
    process.exit(0);
  } catch (error) {
    logger.error('Rollback failed:', error);
    process.exit(1);
  }
}

// CLI handling
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
      runMigrations();
      break;
    case 'down':
      rollbackMigration();
      break;
    default:
      logger.info('Usage: node migrate.js [up|down]');
      logger.info('  up   - Run pending migrations');
      logger.info('  down - Rollback last migration');
      process.exit(1);
  }
}

module.exports = {
  runMigrations,
  rollbackMigration,
};
