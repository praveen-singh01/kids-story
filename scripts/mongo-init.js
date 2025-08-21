// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the bedtime database
db = db.getSiblingDB('bedtime');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'provider', 'roles'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        provider: {
          enum: ['google']
        },
        roles: {
          bsonType: 'array',
          items: {
            enum: ['user', 'admin']
          }
        }
      }
    }
  }
});

db.createCollection('kidprofiles', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'name', 'ageRange'],
      properties: {
        ageRange: {
          enum: ['3-5', '6-8', '9-12']
        }
      }
    }
  }
});

db.createCollection('contents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['type', 'title', 'slug', 'durationSec', 'ageRange', 'audioUrl', 'imageUrl'],
      properties: {
        type: {
          enum: ['story', 'affirmation', 'meditation', 'music']
        },
        ageRange: {
          enum: ['3-5', '6-8', '9-12']
        },
        durationSec: {
          bsonType: 'int',
          minimum: 1,
          maximum: 3600
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ provider: 1, googleId: 1 });
db.users.createIndex({ 'subscription.status': 1 });

db.kidprofiles.createIndex({ userId: 1 });
db.kidprofiles.createIndex({ userId: 1, name: 1 });
db.kidprofiles.createIndex({ ageRange: 1 });

db.contents.createIndex({ slug: 1 }, { unique: true });
db.contents.createIndex({ type: 1, ageRange: 1 });
db.contents.createIndex({ type: 1, tags: 1 });
db.contents.createIndex({ isFeatured: -1, popularityScore: -1, publishedAt: -1 });
db.contents.createIndex({ title: 'text', tags: 'text' });

db.favorites.createIndex({ kidId: 1, contentId: 1 }, { unique: true });
db.favorites.createIndex({ userId: 1, kidId: 1 });

db.highlights.createIndex({ startsAt: 1, endsAt: 1 });
db.highlights.createIndex({ isActive: 1, startsAt: 1, endsAt: 1 });

db.paymentevents.createIndex({ eventId: 1 }, { unique: true });
db.paymentevents.createIndex({ userId: 1, type: 1 });
db.paymentevents.createIndex({ processed: 1, receivedAt: 1 });

print('MongoDB initialization completed successfully');
print('Database: bedtime');
print('Collections created with validation and indexes');
