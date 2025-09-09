const mongoose = require('mongoose');
const { Content, Category } = require('../src/models');
require('dotenv').config();

async function assignStoryCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get categories
    const mythologyCategory = await Category.findOne({ slug: 'mythology' });
    const panchatantraCategory = await Category.findOne({ slug: 'panchatantra' });

    if (!mythologyCategory || !panchatantraCategory) {
      throw new Error('Required categories not found');
    }

    console.log('Found categories:');
    console.log(`- Mythology: ${mythologyCategory._id}`);
    console.log(`- Panchatantra: ${panchatantraCategory._id}`);

    // Get all stories
    const stories = await Content.find({ type: 'story' });
    console.log(`\nFound ${stories.length} stories:`);
    
    stories.forEach(story => {
      console.log(`- ${story.title} (${story._id})`);
    });

    // Assign categories based on story content
    const assignments = [
      {
        // Buddha story goes to Mythology
        storyTitle: 'Buddha and Angulimala',
        categoryId: mythologyCategory._id,
        categoryName: 'Mythology'
      },
      {
        // Brahmin story goes to Panchatantra (pick the first one)
        storyTitle: 'The Brahmin and the Crooks',
        categoryId: panchatantraCategory._id,
        categoryName: 'Panchatantra'
      },
      {
        // The other Brahmin story also goes to Panchatantra
        storyTitle: 'The Bhramins and the the crooks',
        categoryId: panchatantraCategory._id,
        categoryName: 'Panchatantra'
      }
    ];

    console.log('\nAssigning categories...');

    for (const assignment of assignments) {
      // Find story by title (case insensitive)
      const story = await Content.findOne({ 
        title: { $regex: new RegExp(assignment.storyTitle, 'i') }
      });

      if (story) {
        story.category = assignment.categoryId;
        await story.save();
        console.log(`✅ Assigned "${story.title}" to ${assignment.categoryName}`);
      } else {
        console.log(`❌ Story "${assignment.storyTitle}" not found`);
      }
    }

    // Show final results
    console.log('\nFinal story-category assignments:');
    const updatedStories = await Content.find({ type: 'story' }).populate('category', 'name slug');
    
    updatedStories.forEach(story => {
      const categoryName = story.category ? story.category.name : 'No category';
      console.log(`- "${story.title}" → ${categoryName}`);
    });

    console.log('\nStory categories assigned successfully!');
    
  } catch (error) {
    console.error('Error assigning story categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

assignStoryCategories();
