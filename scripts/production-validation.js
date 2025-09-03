#!/usr/bin/env node

/**
 * Production Readiness Validation Script
 * 
 * This script performs comprehensive validation to ensure the backend API
 * is ready for production deployment.
 */

const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class ProductionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addResult(test, status, message) {
    const result = { test, message };
    
    switch (status) {
      case 'pass':
        this.passed.push(result);
        this.log(`${test}: ${message}`, 'success');
        break;
      case 'warning':
        this.warnings.push(result);
        this.log(`${test}: ${message}`, 'warning');
        break;
      case 'error':
        this.errors.push(result);
        this.log(`${test}: ${message}`, 'error');
        break;
    }
  }

  async validateEnvironmentConfiguration() {
    this.log('Validating environment configuration...', 'info');

    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'MONGODB_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'GOOGLE_CLIENT_ID'
    ];

    const productionEnvVars = [
      'CORS_ORIGIN',
      'LOG_LEVEL',
      'BCRYPT_ROUNDS'
    ];

    // Check required environment variables
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.addResult('Environment Variables', 'error', `Missing required environment variable: ${envVar}`);
      } else if (process.env[envVar].includes('your-') || process.env[envVar].includes('change-')) {
        this.addResult('Environment Variables', 'error', `Environment variable ${envVar} contains placeholder value`);
      } else {
        this.addResult('Environment Variables', 'pass', `${envVar} is configured`);
      }
    }

    // Check production-specific variables
    for (const envVar of productionEnvVars) {
      if (!process.env[envVar]) {
        this.addResult('Production Config', 'warning', `Missing production environment variable: ${envVar}`);
      } else {
        this.addResult('Production Config', 'pass', `${envVar} is configured`);
      }
    }

    // Validate JWT secrets strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      this.addResult('Security', 'error', 'JWT_SECRET is too short (minimum 32 characters)');
    } else if (process.env.JWT_SECRET) {
      this.addResult('Security', 'pass', 'JWT_SECRET has adequate length');
    }

    // Validate Google Client ID format
    if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.match(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/)) {
      this.addResult('Google OAuth', 'error', 'GOOGLE_CLIENT_ID format is invalid');
    } else if (process.env.GOOGLE_CLIENT_ID) {
      this.addResult('Google OAuth', 'pass', 'GOOGLE_CLIENT_ID format is valid');
    }

    // Check NODE_ENV for production
    if (process.env.NODE_ENV === 'production') {
      this.addResult('Environment', 'pass', 'NODE_ENV is set to production');
    } else {
      this.addResult('Environment', 'warning', `NODE_ENV is set to ${process.env.NODE_ENV}, not production`);
    }
  }

  async validateDatabaseConnection() {
    this.log('Validating database connection...', 'info');

    try {
      await mongoose.connect(process.env.MONGODB_URI);
      this.addResult('Database', 'pass', 'Successfully connected to MongoDB');

      // Test basic database operations
      const collections = await mongoose.connection.db.listCollections().toArray();
      this.addResult('Database', 'pass', `Found ${collections.length} collections in database`);

      // Check if required collections exist or can be created
      const requiredCollections = ['users', 'kids', 'contents', 'avatars', 'categories', 'favorites', 'progress'];
      for (const collectionName of requiredCollections) {
        const collection = mongoose.connection.db.collection(collectionName);
        await collection.findOne({}); // Test read access
        this.addResult('Database', 'pass', `Collection ${collectionName} is accessible`);
      }

    } catch (error) {
      this.addResult('Database', 'error', `Database connection failed: ${error.message}`);
    }
  }

  async validateAPIEndpoints() {
    this.log('Validating API endpoints...', 'info');

    const endpoints = [
      { method: 'GET', path: '/health', expectedStatus: 200, description: 'Health check' },
      { method: 'GET', path: '/health/detailed', expectedStatus: 200, description: 'Detailed health check' },
      { method: 'GET', path: '/content', expectedStatus: 200, description: 'Content listing' },
      { method: 'GET', path: '/avatars', expectedStatus: 200, description: 'Avatar listing' },
      { method: 'GET', path: '/explore/categories', expectedStatus: 200, description: 'Categories listing' },
      { method: 'GET', path: '/subscriptions/plans', expectedStatus: 200, description: 'Subscription plans' },
      { method: 'POST', path: '/auth/register', expectedStatus: 400, description: 'Registration validation', data: {} },
      { method: 'GET', path: '/nonexistent', expectedStatus: 404, description: '404 handling' }
    ];

    for (const endpoint of endpoints) {
      try {
        const config = {
          method: endpoint.method.toLowerCase(),
          url: `${this.apiBaseUrl}${endpoint.path}`,
          timeout: 10000,
          validateStatus: () => true // Don't throw on any status code
        };

        if (endpoint.data) {
          config.data = endpoint.data;
        }

        const response = await axios(config);

        if (response.status === endpoint.expectedStatus) {
          this.addResult('API Endpoints', 'pass', `${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
        } else {
          this.addResult('API Endpoints', 'error', 
            `${endpoint.method} ${endpoint.path} returned ${response.status}, expected ${endpoint.expectedStatus}`);
        }

        // Check response format for successful requests
        if (response.status < 400 && response.data) {
          if (typeof response.data.success !== 'boolean') {
            this.addResult('API Response Format', 'error', 
              `${endpoint.path} response missing 'success' field`);
          } else {
            this.addResult('API Response Format', 'pass', 
              `${endpoint.path} has correct response format`);
          }
        }

      } catch (error) {
        this.addResult('API Endpoints', 'error', 
          `${endpoint.method} ${endpoint.path} failed: ${error.message}`);
      }
    }
  }

  async validateSecurity() {
    this.log('Validating security configuration...', 'info');

    try {
      // Test CORS headers
      const response = await axios.get(`${this.apiBaseUrl}/health`);
      
      if (response.headers['access-control-allow-origin']) {
        this.addResult('Security', 'pass', 'CORS headers are present');
      } else {
        this.addResult('Security', 'warning', 'CORS headers not found');
      }

      // Test security headers
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      for (const header of securityHeaders) {
        if (response.headers[header]) {
          this.addResult('Security', 'pass', `Security header ${header} is present`);
        } else {
          this.addResult('Security', 'warning', `Security header ${header} is missing`);
        }
      }

      // Test rate limiting
      const requests = Array(10).fill().map(() => 
        axios.get(`${this.apiBaseUrl}/health`).catch(err => err.response)
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res && res.status === 429);
      
      if (rateLimited) {
        this.addResult('Security', 'pass', 'Rate limiting is working');
      } else {
        this.addResult('Security', 'warning', 'Rate limiting may not be configured properly');
      }

    } catch (error) {
      this.addResult('Security', 'error', `Security validation failed: ${error.message}`);
    }
  }

  async validateFileStructure() {
    this.log('Validating file structure...', 'info');

    const requiredFiles = [
      'package.json',
      'src/server.js',
      'src/config/database.js',
      'src/config/logger.js',
      '.env.example',
      'README.md'
    ];

    const requiredDirectories = [
      'src/models',
      'src/routes',
      'src/middleware',
      'src/services',
      'src/utils',
      'tests'
    ];

    for (const file of requiredFiles) {
      if (fs.existsSync(path.join(__dirname, '..', file))) {
        this.addResult('File Structure', 'pass', `Required file ${file} exists`);
      } else {
        this.addResult('File Structure', 'error', `Required file ${file} is missing`);
      }
    }

    for (const dir of requiredDirectories) {
      if (fs.existsSync(path.join(__dirname, '..', dir))) {
        this.addResult('File Structure', 'pass', `Required directory ${dir} exists`);
      } else {
        this.addResult('File Structure', 'error', `Required directory ${dir} is missing`);
      }
    }

    // Check package.json for required dependencies
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
      const requiredDeps = ['express', 'mongoose', 'jsonwebtoken', 'bcryptjs', 'cors', 'helmet'];
      
      for (const dep of requiredDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.addResult('Dependencies', 'pass', `Required dependency ${dep} is present`);
        } else {
          this.addResult('Dependencies', 'error', `Required dependency ${dep} is missing`);
        }
      }
    } catch (error) {
      this.addResult('File Structure', 'error', `Failed to read package.json: ${error.message}`);
    }
  }

  async validatePerformance() {
    this.log('Validating performance...', 'info');

    try {
      const startTime = Date.now();
      await axios.get(`${this.apiBaseUrl}/health`);
      const responseTime = Date.now() - startTime;

      if (responseTime < 1000) {
        this.addResult('Performance', 'pass', `Health endpoint responds in ${responseTime}ms`);
      } else if (responseTime < 3000) {
        this.addResult('Performance', 'warning', `Health endpoint responds in ${responseTime}ms (slow)`);
      } else {
        this.addResult('Performance', 'error', `Health endpoint responds in ${responseTime}ms (too slow)`);
      }

      // Test concurrent requests
      const concurrentRequests = Array(5).fill().map(() => {
        const start = Date.now();
        return axios.get(`${this.apiBaseUrl}/health`).then(() => Date.now() - start);
      });

      const times = await Promise.all(concurrentRequests);
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      if (avgTime < 2000) {
        this.addResult('Performance', 'pass', `Average concurrent response time: ${avgTime.toFixed(0)}ms`);
      } else {
        this.addResult('Performance', 'warning', `Average concurrent response time: ${avgTime.toFixed(0)}ms (slow)`);
      }

    } catch (error) {
      this.addResult('Performance', 'error', `Performance validation failed: ${error.message}`);
    }
  }

  async runAllValidations() {
    this.log('🚀 Starting Production Readiness Validation', 'info');
    this.log('==========================================', 'info');

    await this.validateEnvironmentConfiguration();
    await this.validateDatabaseConnection();
    await this.validateFileStructure();
    await this.validateAPIEndpoints();
    await this.validateSecurity();
    await this.validatePerformance();

    this.generateReport();
  }

  generateReport() {
    this.log('==========================================', 'info');
    this.log('📊 Production Readiness Report', 'info');
    this.log('==========================================', 'info');

    this.log(`✅ Passed: ${this.passed.length}`, 'success');
    this.log(`⚠️  Warnings: ${this.warnings.length}`, 'warning');
    this.log(`❌ Errors: ${this.errors.length}`, 'error');

    if (this.warnings.length > 0) {
      this.log('\n⚠️  WARNINGS:', 'warning');
      this.warnings.forEach(warning => {
        this.log(`   ${warning.test}: ${warning.message}`, 'warning');
      });
    }

    if (this.errors.length > 0) {
      this.log('\n❌ ERRORS:', 'error');
      this.errors.forEach(error => {
        this.log(`   ${error.test}: ${error.message}`, 'error');
      });
    }

    this.log('\n==========================================', 'info');
    
    if (this.errors.length === 0) {
      if (this.warnings.length === 0) {
        this.log('🎉 PRODUCTION READY! All validations passed.', 'success');
      } else {
        this.log('✅ MOSTLY READY! Address warnings before production deployment.', 'warning');
      }
    } else {
      this.log('❌ NOT READY! Fix errors before production deployment.', 'error');
    }

    // Close database connection
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
    }

    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.runAllValidations().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionValidator;
