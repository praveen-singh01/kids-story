const { query, validationResult } = require('express-validator');

// Supported languages configuration
const SUPPORTED_LANGUAGES = ['en', 'hi'];
const DEFAULT_LANGUAGE = 'en';

// Language metadata
const LANGUAGE_INFO = {
  en: {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr'
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr'
  }
};

/**
 * Validation middleware for language parameter
 */
const validateLanguage = [
  query('language')
    .optional()
    .isIn(SUPPORTED_LANGUAGES)
    .withMessage(`Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`)
    .customSanitizer((value) => {
      // Normalize language code to lowercase
      return value ? value.toLowerCase() : DEFAULT_LANGUAGE;
    })
];

/**
 * Middleware to set default language if not provided
 */
const setDefaultLanguage = (req, res, next) => {
  if (!req.query.language) {
    req.query.language = DEFAULT_LANGUAGE;
  }
  next();
};

/**
 * Middleware to validate and normalize language parameter
 */
const normalizeLanguage = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).error(errorMessages, 'Language validation failed');
  }

  // Ensure language is set and normalized
  req.language = req.query.language || DEFAULT_LANGUAGE;
  
  // Add language info to request for convenience
  req.languageInfo = LANGUAGE_INFO[req.language];
  
  next();
};

/**
 * Middleware to check if content supports requested language
 */
const checkLanguageSupport = (content, requestedLanguage) => {
  if (!content) {
    return false;
  }

  // If it's an array, check the first item
  const item = Array.isArray(content) ? content[0] : content;
  
  if (!item) {
    return false;
  }

  // Check if the content has availableLanguages field
  if (item.availableLanguages && Array.isArray(item.availableLanguages)) {
    return item.availableLanguages.includes(requestedLanguage);
  }

  // Fallback: if no availableLanguages field, assume English is supported
  return requestedLanguage === DEFAULT_LANGUAGE;
};

/**
 * Express middleware to validate language support for content
 */
const validateContentLanguageSupport = (req, res, next) => {
  // This middleware should be used after content is fetched
  // It checks if the requested language is supported by the content
  const requestedLanguage = req.language || req.query.language || DEFAULT_LANGUAGE;
  
  // Add a helper function to the response object
  res.checkLanguageSupport = (content) => {
    return checkLanguageSupport(content, requestedLanguage);
  };
  
  next();
};

/**
 * Helper function to get language preference from request headers
 */
const getLanguageFromHeaders = (req) => {
  const acceptLanguage = req.headers['accept-language'];
  
  if (!acceptLanguage) {
    return DEFAULT_LANGUAGE;
  }

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, quality = '1'] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0].toLowerCase(), // Get primary language code
        quality: parseFloat(quality)
      };
    })
    .sort((a, b) => b.quality - a.quality); // Sort by quality

  // Find the first supported language
  for (const lang of languages) {
    if (SUPPORTED_LANGUAGES.includes(lang.code)) {
      return lang.code;
    }
  }

  return DEFAULT_LANGUAGE;
};

/**
 * Middleware to detect language from headers if not provided in query
 */
const detectLanguageFromHeaders = (req, res, next) => {
  if (!req.query.language) {
    req.query.language = getLanguageFromHeaders(req);
  }
  next();
};

/**
 * Helper function to format error messages in the appropriate language
 */
const getLocalizedErrorMessage = (errorKey, language = DEFAULT_LANGUAGE) => {
  const errorMessages = {
    en: {
      'content_not_found': 'Content not found',
      'language_not_supported': 'Content not available in the requested language',
      'invalid_language': 'Invalid language code',
      'validation_failed': 'Validation failed'
    },
    hi: {
      'content_not_found': 'सामग्री नहीं मिली',
      'language_not_supported': 'अनुरोधित भाषा में सामग्री उपलब्ध नहीं है',
      'invalid_language': 'अमान्य भाषा कोड',
      'validation_failed': 'सत्यापन असफल'
    }
  };

  return errorMessages[language]?.[errorKey] || errorMessages[DEFAULT_LANGUAGE][errorKey] || errorKey;
};

/**
 * Middleware to add localized error helper to response
 */
const addLocalizedErrorHelper = (req, res, next) => {
  const language = req.language || req.query.language || DEFAULT_LANGUAGE;
  
  res.localizedError = (errorKey, statusCode = 400) => {
    const message = getLocalizedErrorMessage(errorKey, language);
    return res.status(statusCode).error([message], message);
  };
  
  next();
};

module.exports = {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_INFO,
  validateLanguage,
  setDefaultLanguage,
  normalizeLanguage,
  checkLanguageSupport,
  validateContentLanguageSupport,
  getLanguageFromHeaders,
  detectLanguageFromHeaders,
  getLocalizedErrorMessage,
  addLocalizedErrorHelper
};
