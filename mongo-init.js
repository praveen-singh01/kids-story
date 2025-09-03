// MongoDB initialization script for Docker
db = db.getSiblingDB('kids-story-app');

// Create collections with indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ providerId: 1 });
db.users.createIndex({ emailVerificationToken: 1 });

db.createCollection('kids');
db.kids.createIndex({ userId: 1 });
db.kids.createIndex({ userId: 1, isActive: 1 });

db.createCollection('contents');
db.contents.createIndex({ slug: 1 }, { unique: true });
db.contents.createIndex({ type: 1, isActive: 1 });
db.contents.createIndex({ ageRange: 1, isActive: 1 });
db.contents.createIndex({ tags: 1, isActive: 1 });
db.contents.createIndex({ title: 'text', description: 'text' });

db.createCollection('favorites');
db.favorites.createIndex({ userId: 1, contentId: 1 }, { unique: true });
db.favorites.createIndex({ userId: 1, savedAt: -1 });

db.createCollection('progress');
db.progress.createIndex({ userId: 1, contentId: 1 }, { unique: true });
db.progress.createIndex({ userId: 1, lastPlayedAt: -1 });

db.createCollection('categories');
db.categories.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ parentId: 1, isActive: 1 });

db.createCollection('avatars');
db.avatars.createIndex({ isActive: 1, sortOrder: 1 });

print('Database initialized successfully!');
