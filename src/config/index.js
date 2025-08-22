require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/bedtime',
  // TODO: Redis temporarily disabled
  // redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d',
  },
  
  // Google Auth
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  
  // CDN & Assets
  cdnBase: process.env.CDN_BASE || 'https://cdn.example.com',
  
  // CORS
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Payments Integration
  payments: {
    baseUrl: process.env.PAYMENTS_BASE_URL || 'http://payments-svc:4000/api/v1',
    m2mSecret: process.env.SERVICE_M2M_SECRET || 'fallback-m2m-secret',
    coreIss: process.env.M2M_CORE_ISS || 'core',
    coreAudPayments: process.env.M2M_CORE_AUD_PAYMENTS || 'payments',
    paymentsIss: process.env.M2M_PAYMENTS_ISS || 'payments',
    coreAud: process.env.M2M_CORE_AUD || 'core',
  },
  
  // Rate Limiting
  rateLimit: {
    public: {
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute per IP
    },
    auth: {
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 requests per minute per IP for auth endpoints
    },
    perUser: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute per user
    },
  },
  
  // Cache TTL (seconds)
  cache: {
    home: 300, // 5 minutes
    explore: 600, // 10 minutes
    content: 3600, // 1 hour
  },
};

// Validation
if (!config.googleClientId && config.nodeEnv === 'production') {
  throw new Error('GOOGLE_CLIENT_ID is required in production');
}

if (!config.jwt.accessSecret || config.jwt.accessSecret === 'fallback-access-secret') {
  console.warn('⚠️  Using fallback JWT_ACCESS_SECRET. Set a secure secret in production!');
}

if (!config.jwt.refreshSecret || config.jwt.refreshSecret === 'fallback-refresh-secret') {
  console.warn('⚠️  Using fallback JWT_REFRESH_SECRET. Set a secure secret in production!');
}

module.exports = config;
