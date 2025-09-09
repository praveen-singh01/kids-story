const mongoose = require('mongoose');
const { Category } = require('../src/models');
require('dotenv').config();

const sampleCategories = [
  {
    name: 'Mythology',
    description: 'Stories from ancient Indian mythology featuring gods, goddesses, and legendary heroes',
    imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/categories/mythology.jpg',
    sortOrder: 1
  },
  {
    name: 'Panchatantra',
    description: 'Classic moral stories with animals teaching valuable life lessons',
    imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/categories/panchatantra.jpg',
    sortOrder: 2
  },
  {
    name: 'Short Stories',
    description: 'Quick and engaging stories perfect for bedtime',
    imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/categories/short-stories.jpg',
    sortOrder: 3
  },
  {
    name: 'Adventure',
    description: 'Exciting adventures and journeys for young explorers',
    imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/categories/adventure.jpg',
    sortOrder: 4
  },
  {
    name: 'Fairy Tales',
    description: 'Magical stories with princesses, wizards, and happy endings',
    imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/categories/fairy-tales.jpg',
    sortOrder: 5
  },
  {
    name: 'Educational',
    description: 'Stories that teach science, history, and other subjects',
    imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/categories/educational.jpg',
    sortOrder: 6
  }
];

async function setupCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Create sample categories one by one to trigger pre-save hooks
    const categories = [];
    for (const categoryData of sampleCategories) {
      const category = new Category(categoryData);
      await category.save();
      categories.push(category);
    }

    console.log(`Created ${categories.length} categories:`);

    categories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`);
    });

    console.log('\nCategories setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupCategories();
