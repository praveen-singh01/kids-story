require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./src/config');
const { User, Category, Content } = require('./src/models');

// Production-ready categories
const categories = [
  {
    name: 'Stories',
    description: 'Bedtime stories to spark imagination and help kids drift off to sleep',
    slug: 'stories',
    metadata: {
      color: '#FF6B6B',
      icon: 'book',
    },
    sortOrder: 1,
  },
  {
    name: 'Affirmations',
    description: 'Positive affirmations to build confidence and self-esteem',
    slug: 'affirmations',
    metadata: {
      color: '#4ECDC4',
      icon: 'heart',
    },
    sortOrder: 2,
  },
  {
    name: 'Meditations',
    description: 'Guided meditations for relaxation and mindfulness',
    slug: 'meditations',
    metadata: {
      color: '#45B7D1',
      icon: 'lotus',
    },
    sortOrder: 3,
  },
  {
    name: 'Music',
    description: 'Soothing music and lullabies for peaceful sleep',
    slug: 'music',
    metadata: {
      color: '#96CEB4',
      icon: 'music',
    },
    sortOrder: 4,
  },
];

// Production-ready sample content
const sampleContent = [
  {
    type: 'story',
    title: 'The Sleepy Forest',
    slug: 'the-sleepy-forest',
    durationSec: 480,
    ageRange: '3-5',
    tags: ['folk_tales', 'calming'],
    audioUrl: 'https://milo.netaapp.in/uploads/audio/stories/sleepy-forest.mp3',
    imageUrl: 'https://milo.netaapp.in/uploads/images/stories/sleepy-forest.jpg',
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
    audioUrl: 'https://milo.netaapp.in/uploads/audio/stories/magic-pillow.mp3',
    imageUrl: 'https://milo.netaapp.in/uploads/images/stories/magic-pillow.jpg',
    isFeatured: false,
    popularityScore: 78,
  },
  {
    type: 'affirmation',
    title: 'I Am Brave and Strong',
    slug: 'i-am-brave-and-strong',
    durationSec: 180,
    ageRange: '3-5',
    tags: ['affirmations', 'calming'],
    audioUrl: 'https://milo.netaapp.in/uploads/audio/affirmations/brave-strong.mp3',
    imageUrl: 'https://milo.netaapp.in/uploads/images/affirmations/brave-strong.jpg',
    isFeatured: false,
    popularityScore: 65,
  },
  {
    type: 'meditation',
    title: 'Peaceful Garden',
    slug: 'peaceful-garden',
    durationSec: 600,
    ageRange: '6-8',
    tags: ['meditations', 'calming'],
    audioUrl: 'https://milo.netaapp.in/uploads/audio/meditations/peaceful-garden.mp3',
    imageUrl: 'https://milo.netaapp.in/uploads/images/meditations/peaceful-garden.jpg',
    isFeatured: true,
    popularityScore: 72,
  },
  {
    type: 'music',
    title: 'Lullaby Dreams',
    slug: 'lullaby-dreams',
    durationSec: 900,
    ageRange: '3-5',
    tags: ['music', 'calming'],
    audioUrl: 'https://milo.netaapp.in/uploads/audio/music/lullaby-dreams.mp3',
    imageUrl: 'https://milo.netaapp.in/uploads/images/music/lullaby-dreams.jpg',
    isFeatured: true,
    popularityScore: 92,
  },
];

async function connectToDatabase() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB Atlas');
    console.log('🌐 Database:', config.mongoUri.includes('mongodb.net') ? 'Production (Atlas)' : 'Local');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function createAdminUser() {
  console.log('👤 Creating admin user...');
  
  const existingAdmin = await User.findOne({ email: 'admin@milo.netaapp.in' });
  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return existingAdmin;
  }

  const hashedPassword = await bcrypt.hash('MiloAdmin2024!', 12);
  const adminUser = new User({
    email: 'admin@milo.netaapp.in',
    password: hashedPassword,
    name: 'Milo Admin',
    roles: ['admin', 'user'],
    isEmailVerified: true,
  });

  await adminUser.save();
  console.log('✅ Admin user created: admin@milo.netaapp.in / MiloAdmin2024!');
  return adminUser;
}

async function createCategories() {
  console.log('📁 Creating categories...');
  
  const createdCategories = {};
  
  for (const categoryData of categories) {
    const existing = await Category.findOne({ slug: categoryData.slug });
    if (existing) {
      console.log(`✅ Category "${categoryData.name}" already exists`);
      createdCategories[categoryData.slug] = existing;
      continue;
    }

    const category = new Category(categoryData);
    await category.save();
    createdCategories[categoryData.slug] = category;
    console.log(`✅ Created category: ${categoryData.name}`);
  }
  
  return createdCategories;
}

async function createContent(categories) {
  console.log('📝 Creating sample content...');
  
  const typeToCategory = {
    'story': 'stories',
    'affirmation': 'affirmations',
    'meditation': 'meditations',
    'music': 'music',
  };
  
  for (const contentData of sampleContent) {
    const existing = await Content.findOne({ slug: contentData.slug });
    if (existing) {
      console.log(`✅ Content "${contentData.title}" already exists`);
      continue;
    }

    const categorySlug = typeToCategory[contentData.type];
    const category = categories[categorySlug];
    
    if (!category) {
      console.log(`❌ Category not found for type: ${contentData.type}`);
      continue;
    }

    const content = new Content({
      ...contentData,
      categoryId: category._id,
    });
    
    await content.save();
    console.log(`✅ Created content: ${contentData.title}`);
  }
}

async function updateCategoryCounts(categories) {
  console.log('🔢 Updating category content counts...');
  
  for (const category of Object.values(categories)) {
    const count = await Content.countDocuments({ 
      categoryId: category._id, 
      isActive: true 
    });
    category.contentCount = count;
    await category.save();
    console.log(`✅ Updated ${category.name}: ${count} items`);
  }
}

async function main() {
  try {
    console.log('🚀 Setting up PRODUCTION data for Milo Kids Story API...\n');
    
    await connectToDatabase();
    
    const adminUser = await createAdminUser();
    const categories = await createCategories();
    await createContent(categories);
    await updateCategoryCounts(categories);
    
    console.log('\n🎉 Production data setup completed!');
    console.log('\n📋 What was created:');
    console.log('👤 Admin user: admin@milo.netaapp.in / MiloAdmin2024!');
    console.log('📁 Categories: Stories, Affirmations, Meditations, Music');
    console.log('📝 Sample content: 5 items across all categories');
    console.log('\n🔗 Test the Production API:');
    console.log('curl https://milo.netaapp.in/api/v1/explore/categories');
    console.log('curl https://milo.netaapp.in/api/v1/explore/list');
    console.log('\n🔐 Admin Login:');
    console.log('Email: admin@milo.netaapp.in');
    console.log('Password: MiloAdmin2024!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

main();
