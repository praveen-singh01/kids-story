const request = require('supertest');
const app = require('../src/server');
const { Content } = require('../src/models');

describe('Basic Bilingual Content Test', () => {
  let testContent;

  beforeEach(async () => {
    // Create a simple test content
    testContent = new Content({
      type: 'story',
      title: 'Simple Test Story',
      description: 'A simple test story',
      durationSec: 300,
      ageRange: '6-8',
      tags: ['test'],
      defaultLanguage: 'en',
      availableLanguages: ['en', 'hi'],
      isFeatured: true,
      popularityScore: 4.0
    });

    // Manually set the languages object
    testContent.languages = {};
    testContent.languages['en'] = {
      title: 'Simple Test Story',
      description: 'A simple test story',
      audioUrl: '/assets/test-en.mp3',
      imageUrl: '/assets/test-en.png',
      metadata: { keyValue: 'Test', summary: 'English test' }
    };
    testContent.languages['hi'] = {
      title: 'सरल परीक्षण कहानी',
      description: 'एक सरल परीक्षण कहानी',
      audioUrl: '/assets/test-hi.mp3',
      imageUrl: '/assets/test-hi.png',
      metadata: { keyValue: 'परीक्षण', summary: 'हिंदी परीक्षण' }
    };

    try {
      await testContent.save();
      console.log('Test content created with slug:', testContent.slug);
      console.log('Languages object keys:', Object.keys(testContent.languages));
    } catch (error) {
      console.error('Error saving test content:', error);
      throw error;
    }
  });

  afterEach(async () => {
    if (testContent) {
      await Content.deleteMany({ slug: testContent.slug });
    }
  });

  it('should create content with bilingual support', () => {
    expect(testContent.slug).toBe('simple-test-story');
    expect(testContent.availableLanguages).toContain('en');
    expect(testContent.availableLanguages).toContain('hi');
    expect(Object.keys(testContent.languages).length).toBe(2);
  });

  it('should get English content', () => {
    const englishContent = testContent.getLanguageContent('en');
    expect(englishContent.title).toBe('Simple Test Story');
    expect(englishContent.audioUrl).toBe('/assets/test-en.mp3');
  });

  it('should get Hindi content', () => {
    const hindiContent = testContent.getLanguageContent('hi');
    expect(hindiContent.title).toBe('सरल परीक्षण कहानी');
    expect(hindiContent.audioUrl).toBe('/assets/test-hi.mp3');
  });

  it('should convert to language JSON', () => {
    const englishJSON = testContent.toLanguageJSON('en');
    expect(englishJSON.title).toBe('Simple Test Story');
    expect(englishJSON.requestedLanguage).toBe('en');

    const hindiJSON = testContent.toLanguageJSON('hi');
    expect(hindiJSON.title).toBe('सरल परीक्षण कहानी');
    expect(hindiJSON.requestedLanguage).toBe('hi');
  });

  it('should return content via API in English', async () => {
    const response = await request(app)
      .get(`/api/v1/content/${testContent.slug}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Simple Test Story');
    expect(response.body.data.requestedLanguage).toBe('en');
  });

  it('should return content via API in Hindi', async () => {
    const response = await request(app)
      .get(`/api/v1/content/${testContent.slug}?language=hi`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('सरल परीक्षण कहानी');
    expect(response.body.data.requestedLanguage).toBe('hi');
  });

  it('should return available languages', async () => {
    const response = await request(app)
      .get('/api/v1/content/languages')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    
    const languages = response.body.data;
    expect(languages.length).toBeGreaterThanOrEqual(2);
    
    const englishLang = languages.find(lang => lang.code === 'en');
    const hindiLang = languages.find(lang => lang.code === 'hi');
    
    expect(englishLang).toBeDefined();
    expect(hindiLang).toBeDefined();
  });
});
