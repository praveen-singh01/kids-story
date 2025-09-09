const mongoose = require('mongoose');
const slugify = require('slugify');

// CDN configuration
const CDN_BASE_URL = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN
  ? `https://${process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN}`
  : 'https://d1ta1qd8y4woyq.cloudfront.net';

// Helper function to convert relative URLs to CDN URLs
const toCDNUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http')) return url; // Already absolute URL
  if (url.startsWith('/assets/')) {
    return `${CDN_BASE_URL}${url}`;
  }
  return url;
};

const contentMetadataSchema = new mongoose.Schema({
  keyValue: {
    type: String,
    maxlength: 100
  },
  summary: {
    type: String,
    maxlength: 1000
  }
}, { _id: false });

// Schema for language-specific content
const languageContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  audioUrl: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  metadata: {
    type: contentMetadataSchema,
    default: () => ({})
  }
}, { _id: false });

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['story', 'meditation', 'affirmation', 'sound']
  },
  // Base title and slug (usually in default language)
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  // Base description (usually in default language)
  description: {
    type: String,
    maxlength: 2000
  },
  durationSec: {
    type: Number,
    required: true,
    min: 1
  },
  ageRange: {
    type: String,
    required: true,
    enum: ['3-5', '6-8', '9-12', '13+']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Language support
  defaultLanguage: {
    type: String,
    default: 'en',
    enum: ['en', 'hi'],
    maxlength: 5
  },
  availableLanguages: [{
    type: String,
    enum: ['en', 'hi'],
    maxlength: 5
  }],

  // Language-specific content
  languages: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },

  // Legacy fields for backward compatibility
  language: {
    type: String,
    default: 'en',
    maxlength: 5
  },
  region: {
    type: String,
    default: 'US',
    maxlength: 5
  },
  audioUrl: {
    type: String
  },
  imageUrl: {
    type: String
  },
  thumbnailUrl: {
    type: String
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  // New collection and trending flags
  isNewCollection: {
    type: Boolean,
    default: false
  },
  isTrendingNow: {
    type: Boolean,
    default: false
  },
  popularityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  metadata: {
    type: contentMetadataSchema,
    default: () => ({})
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.isActive;
      delete ret.viewCount;
      delete ret.favoriteCount;

      // Languages is already an object, no conversion needed

      return ret;
    }
  }
});

// Indexes
contentSchema.index({ slug: 1 });
contentSchema.index({ type: 1, isActive: 1 });
contentSchema.index({ ageRange: 1, isActive: 1 });
contentSchema.index({ tags: 1, isActive: 1 });
contentSchema.index({ isFeatured: 1, isActive: 1 });
contentSchema.index({ isNewCollection: 1, isActive: 1 });
contentSchema.index({ isTrendingNow: 1, isActive: 1 });
contentSchema.index({ popularityScore: -1, isActive: 1 });
contentSchema.index({ publishedAt: -1, isActive: 1 });
contentSchema.index({ defaultLanguage: 1, isActive: 1 });
contentSchema.index({ availableLanguages: 1, isActive: 1 });
contentSchema.index({ title: 'text', description: 'text' }); // Text search index

// Pre-save middleware to generate slug and handle language setup
contentSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }

  // Ensure availableLanguages includes defaultLanguage
  if (this.defaultLanguage && !this.availableLanguages.includes(this.defaultLanguage)) {
    this.availableLanguages.push(this.defaultLanguage);
  }

  // For backward compatibility: if legacy fields exist but no language content, create it
  if (this.isNew && this.audioUrl && this.imageUrl && (!this.languages || Object.keys(this.languages).length === 0)) {
    if (!this.languages) {
      this.languages = {};
    }

    this.languages[this.defaultLanguage || 'en'] = {
      title: this.title,
      description: this.description,
      audioUrl: this.audioUrl,
      imageUrl: this.imageUrl,
      thumbnailUrl: this.thumbnailUrl,
      metadata: this.metadata
    };
  }

  next();
});

// Method to increment view count
contentSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to update popularity score based on views and favorites
contentSchema.methods.updatePopularityScore = function() {
  // Simple algorithm: (favorites * 2 + views * 0.1) / 100, capped at 5
  const score = Math.min(5, (this.favoriteCount * 2 + this.viewCount * 0.1) / 100);
  this.popularityScore = Math.round(score * 10) / 10; // Round to 1 decimal
  return this.save();
};

// Method to get content in a specific language
contentSchema.methods.getLanguageContent = function(language = 'en') {
  let content;

  // If languages object exists and has the requested language
  if (this.languages && this.languages[language]) {
    content = this.languages[language];
  }
  // Fallback to default language
  else if (this.languages && this.languages[this.defaultLanguage]) {
    content = this.languages[this.defaultLanguage];
  }
  // Legacy fallback - return base fields
  else {
    content = {
      title: this.title,
      description: this.description,
      audioUrl: this.audioUrl,
      imageUrl: this.imageUrl,
      thumbnailUrl: this.thumbnailUrl,
      metadata: this.metadata
    };
  }

  // Convert relative URLs to CDN URLs
  if (content) {
    return {
      ...content,
      audioUrl: toCDNUrl(content.audioUrl),
      imageUrl: toCDNUrl(content.imageUrl),
      thumbnailUrl: toCDNUrl(content.thumbnailUrl)
    };
  }

  return content;
};

// Method to add or update language content
contentSchema.methods.setLanguageContent = function(language, content) {
  if (!this.languages) {
    this.languages = {};
  }

  this.languages[language] = content;

  // Update available languages
  if (!this.availableLanguages.includes(language)) {
    this.availableLanguages.push(language);
  }

  return this;
};

// Method to get content with language-specific data merged
contentSchema.methods.toLanguageJSON = function(language = 'en') {
  const obj = this.toJSON();
  const langContent = this.getLanguageContent(language);

  // Merge language-specific content
  const result = {
    ...obj,
    ...langContent,
    requestedLanguage: language,
    availableLanguages: this.availableLanguages
  };

  // Remove the full languages object since we're returning language-specific data
  delete result.languages;

  // Override legacy fields to match the requested language
  // These fields should reflect the requested language, not the base document language
  result.language = language;

  // For region, we could map languages to regions, but for now keep it simple
  // You might want to add language-to-region mapping in the future
  if (language === 'hi') {
    result.region = 'IN'; // Hindi -> India
  } else if (language === 'en') {
    result.region = 'US'; // English -> US (or could be GB, AU, etc.)
  }

  // Ensure CDN URLs for any remaining relative URLs in the base object
  if (result.audioUrl) result.audioUrl = toCDNUrl(result.audioUrl);
  if (result.imageUrl) result.imageUrl = toCDNUrl(result.imageUrl);
  if (result.thumbnailUrl) result.thumbnailUrl = toCDNUrl(result.thumbnailUrl);

  return result;
};

module.exports = mongoose.model('Content', contentSchema);
