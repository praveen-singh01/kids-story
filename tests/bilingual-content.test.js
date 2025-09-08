const request = require('supertest');
const app = require('../src/server');
const { Content } = require('../src/models');
const {
  checkLanguageSupport,
  getLanguageFromHeaders,
  getLocalizedErrorMessage
} = require('../src/middleware/language');

describe('Bilingual Content API', () => {
  let testContent;
  let bilingualContent;

  beforeAll(async () => {
    // Create test content with bilingual support
    bilingualContent = new Content({
      type: 'story',
      title: 'Test Bilingual Story',
      description: 'A test story for bilingual functionality',
      durationSec: 300,
      ageRange: '6-8',
      tags: ['test', 'bilingual'],
      defaultLanguage: 'en',
      availableLanguages: ['en', 'hi'],
      isFeatured: true,
      popularityScore: 4.0
    });

    // Set language-specific content
    bilingualContent.languages = new Map();
    bilingualContent.languages.set('en', {
      title: 'Test Bilingual Story',
      description: 'A test story for bilingual functionality',
      audioUrl: '/assets/test-english.mp3',
      imageUrl: '/assets/test-english.png',
      metadata: {
        keyValue: 'Testing',
        summary: 'This is a test story in English'
      }
    });
    bilingualContent.languages.set('hi', {
      title: 'परीक्षण द्विभाषी कहानी',
      description: 'द्विभाषी कार्यक्षमता के लिए एक परीक्षण कहानी',
      audioUrl: '/assets/test-hindi.mp3',
      imageUrl: '/assets/test-hindi.png',
      metadata: {
        keyValue: 'परीक्षण',
        summary: 'यह हिंदी में एक परीक्षण कहानी है'
      }
    });

    await bilingualContent.save();

    // Create English-only content for testing
    testContent = new Content({
      type: 'story',
      title: 'English Only Story',
      description: 'A story available only in English',
      durationSec: 240,
      ageRange: '3-5',
      tags: ['english', 'test'],
      defaultLanguage: 'en',
      availableLanguages: ['en'],
      audioUrl: '/assets/english-only.mp3',
      imageUrl: '/assets/english-only.png'
    });

    await testContent.save();
  });

  afterAll(async () => {
    // Clean up test data
    await Content.deleteMany({ 
      slug: { $in: ['test-bilingual-story', 'english-only-story'] }
    });
  });

  describe('GET /api/v1/content', () => {
    it('should return content in English by default', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('en');
      expect(Array.isArray(response.body.data.content)).toBe(true);
      
      // Check if bilingual content is returned with English data
      const bilingualItem = response.body.data.content.find(
        item => item.slug === 'test-bilingual-story'
      );
      
      if (bilingualItem) {
        expect(bilingualItem.title).toBe('Test Bilingual Story');
        expect(bilingualItem.requestedLanguage).toBe('en');
        expect(bilingualItem.availableLanguages).toContain('en');
        expect(bilingualItem.availableLanguages).toContain('hi');
      }
    });

    it('should return content in Hindi when requested', async () => {
      const response = await request(app)
        .get('/api/v1/content?language=hi')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('hi');
      
      // Should only return content that has Hindi available
      const hindiContent = response.body.data.content.find(
        item => item.slug === 'test-bilingual-story'
      );
      
      expect(hindiContent).toBeDefined();
      expect(hindiContent.title).toBe('परीक्षण द्विभाषी कहानी');
      expect(hindiContent.requestedLanguage).toBe('hi');
      expect(hindiContent.audioUrl).toBe('/assets/test-hindi.mp3');
      expect(hindiContent.imageUrl).toBe('/assets/test-hindi.png');
    });

    it('should filter out content not available in requested language', async () => {
      const response = await request(app)
        .get('/api/v1/content?language=hi')
        .expect(200);

      // English-only content should not appear in Hindi results
      const englishOnlyContent = response.body.data.content.find(
        item => item.slug === 'english-only-story'
      );
      
      expect(englishOnlyContent).toBeUndefined();
    });

    it('should reject invalid language codes', async () => {
      await request(app)
        .get('/api/v1/content?language=fr')
        .expect(400);
    });
  });

  describe('GET /api/v1/content/:slug', () => {
    it('should return content in requested language', async () => {
      const response = await request(app)
        .get(`/api/v1/content/${bilingualContent.slug}?language=hi`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('परीक्षण द्विभाषी कहानी');
      expect(response.body.data.requestedLanguage).toBe('hi');
      expect(response.body.data.audioUrl).toBe('/assets/test-hindi.mp3');
      expect(response.body.data.metadata.keyValue).toBe('परीक्षण');
    });

    it('should return English content when no language specified', async () => {
      const response = await request(app)
        .get(`/api/v1/content/${bilingualContent.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Bilingual Story');
      expect(response.body.data.requestedLanguage).toBe('en');
      expect(response.body.data.audioUrl).toBe('/assets/test-english.mp3');
    });

    it('should return 400 when requesting unavailable language', async () => {
      const response = await request(app)
        .get(`/api/v1/content/${testContent.slug}?language=hi`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Content not available in the requested language');
    });

    it('should return 404 for non-existent content', async () => {
      await request(app)
        .get('/api/v1/content/non-existent-slug?language=hi')
        .expect(404);
    });
  });

  describe('GET /api/v1/content/featured', () => {
    it('should return featured content in requested language', async () => {
      const response = await request(app)
        .get('/api/v1/content/featured?language=hi')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('hi');
      
      const featuredContent = response.body.data.content.find(
        item => item.slug === 'test-bilingual-story'
      );
      
      if (featuredContent) {
        expect(featuredContent.title).toBe('परीक्षण द्विभाषी कहानी');
        expect(featuredContent.isFeatured).toBe(true);
      }
    });
  });

  describe('GET /api/v1/content/search', () => {
    it('should search content in requested language', async () => {
      const response = await request(app)
        .get('/api/v1/content/search?query=test&language=hi')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('hi');
      
      // Should find bilingual content but return Hindi version
      const searchResult = response.body.data.content.find(
        item => item.slug === 'test-bilingual-story'
      );
      
      if (searchResult) {
        expect(searchResult.title).toBe('परीक्षण द्विभाषी कहानी');
      }
    });
  });

  describe('GET /api/v1/content/type/:type', () => {
    it('should return content by type in requested language', async () => {
      const response = await request(app)
        .get('/api/v1/content/type/story?language=hi')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('hi');
      
      const storyContent = response.body.data.content.find(
        item => item.slug === 'test-bilingual-story'
      );
      
      if (storyContent) {
        expect(storyContent.type).toBe('story');
        expect(storyContent.title).toBe('परीक्षण द्विभाषी कहानी');
      }
    });
  });

  describe('GET /api/v1/content/languages', () => {
    it('should return available languages', async () => {
      const response = await request(app)
        .get('/api/v1/content/languages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      const languages = response.body.data;
      expect(languages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'en',
            name: 'English',
            nativeName: 'English'
          }),
          expect.objectContaining({
            code: 'hi',
            name: 'Hindi',
            nativeName: 'हिन्दी'
          })
        ])
      );
    });
  });

  describe('Content Model Methods', () => {
    it('should get language content correctly', () => {
      const englishContent = bilingualContent.getLanguageContent('en');
      expect(englishContent.title).toBe('Test Bilingual Story');
      expect(englishContent.audioUrl).toBe('/assets/test-english.mp3');

      const hindiContent = bilingualContent.getLanguageContent('hi');
      expect(hindiContent.title).toBe('परीक्षण द्विभाषी कहानी');
      expect(hindiContent.audioUrl).toBe('/assets/test-hindi.mp3');
    });

    it('should fallback to default language when requested language not available', () => {
      const fallbackContent = testContent.getLanguageContent('hi');
      expect(fallbackContent.title).toBe('English Only Story');
    });

    it('should convert to language JSON correctly', () => {
      const englishJSON = bilingualContent.toLanguageJSON('en');
      expect(englishJSON.title).toBe('Test Bilingual Story');
      expect(englishJSON.requestedLanguage).toBe('en');
      expect(englishJSON.availableLanguages).toContain('en');
      expect(englishJSON.availableLanguages).toContain('hi');

      const hindiJSON = bilingualContent.toLanguageJSON('hi');
      expect(hindiJSON.title).toBe('परीक्षण द्विभाषी कहानी');
      expect(hindiJSON.requestedLanguage).toBe('hi');
    });
  });

  describe('Language Middleware', () => {
    describe('checkLanguageSupport', () => {
      it('should return true for supported language', () => {
        const content = { availableLanguages: ['en', 'hi'] };
        expect(checkLanguageSupport(content, 'hi')).toBe(true);
        expect(checkLanguageSupport(content, 'en')).toBe(true);
      });

      it('should return false for unsupported language', () => {
        const content = { availableLanguages: ['en'] };
        expect(checkLanguageSupport(content, 'hi')).toBe(false);
      });

      it('should return true for English when no availableLanguages field', () => {
        const content = { title: 'Test' };
        expect(checkLanguageSupport(content, 'en')).toBe(true);
        expect(checkLanguageSupport(content, 'hi')).toBe(false);
      });

      it('should handle array of content', () => {
        const contentArray = [{ availableLanguages: ['en', 'hi'] }];
        expect(checkLanguageSupport(contentArray, 'hi')).toBe(true);
      });
    });

    describe('getLanguageFromHeaders', () => {
      it('should parse Accept-Language header correctly', () => {
        const req1 = { headers: { 'accept-language': 'hi,en;q=0.9' } };
        expect(getLanguageFromHeaders(req1)).toBe('hi');

        const req2 = { headers: { 'accept-language': 'en-US,en;q=0.9,hi;q=0.8' } };
        expect(getLanguageFromHeaders(req2)).toBe('en');

        const req3 = { headers: { 'accept-language': 'fr,hi;q=0.8,en;q=0.6' } };
        expect(getLanguageFromHeaders(req3)).toBe('hi');
      });

      it('should return default language when no header', () => {
        const req = { headers: {} };
        expect(getLanguageFromHeaders(req)).toBe('en');
      });
    });

    describe('getLocalizedErrorMessage', () => {
      it('should return English error messages', () => {
        expect(getLocalizedErrorMessage('content_not_found', 'en')).toBe('Content not found');
        expect(getLocalizedErrorMessage('language_not_supported', 'en')).toBe('Content not available in the requested language');
      });

      it('should return Hindi error messages', () => {
        expect(getLocalizedErrorMessage('content_not_found', 'hi')).toBe('सामग्री नहीं मिली');
        expect(getLocalizedErrorMessage('language_not_supported', 'hi')).toBe('अनुरोधित भाषा में सामग्री उपलब्ध नहीं है');
      });

      it('should fallback to English for unknown language', () => {
        expect(getLocalizedErrorMessage('content_not_found', 'fr')).toBe('Content not found');
      });

      it('should fallback to key for unknown error', () => {
        expect(getLocalizedErrorMessage('unknown_error', 'en')).toBe('unknown_error');
      });
    });
  });
});
