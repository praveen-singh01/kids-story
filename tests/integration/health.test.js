const request = require('supertest');
const express = require('express');
const { expressLoader } = require('../../src/loaders/expressLoader');
const routesLoader = require('../../src/loaders/routesLoader');

// Create test app
const app = express();
expressLoader(app);
routesLoader(app);

describe('Health Endpoints', () => {
  describe('GET /healthz', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('components');
      expect(response.body.data.components).toHaveProperty('mongodb');
      expect(response.body.data.components).toHaveProperty('redis');
    });

    test('should include version and environment info', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('environment');
    });
  });

  describe('GET /readyz', () => {
    test('should return readiness status', async () => {
      const response = await request(app)
        .get('/readyz')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('components');
    });
  });

  describe('GET /metrics', () => {
    test('should return basic metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('nodeVersion');
      expect(response.body.data).toHaveProperty('platform');
      expect(response.body.data).toHaveProperty('arch');
    });

    test('should return numeric uptime', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(typeof response.body.data.uptime).toBe('number');
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });

    test('should return memory usage object', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      const memory = response.body.data.memory;
      expect(memory).toHaveProperty('rss');
      expect(memory).toHaveProperty('heapTotal');
      expect(memory).toHaveProperty('heapUsed');
      expect(memory).toHaveProperty('external');
    });
  });

  describe('GET /ping', () => {
    test('should return pong', async () => {
      const response = await request(app)
        .get('/ping')
        .expect(200);

      expect(response.body.message).toBe('pong');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
