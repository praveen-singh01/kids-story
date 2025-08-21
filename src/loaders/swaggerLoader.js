const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Load Swagger documentation
 */
function swaggerLoader(app) {
  try {
    const swaggerPath = path.join(__dirname, '../../openapi.yaml');
    
    // Check if OpenAPI spec exists
    if (!fs.existsSync(swaggerPath)) {
      logger.warn('OpenAPI specification not found at openapi.yaml');
      
      // Serve a placeholder docs page
      app.get('/docs', (req, res) => {
        res.send(`
          <html>
            <head><title>API Documentation</title></head>
            <body>
              <h1>Bedtime Stories API</h1>
              <p>API documentation will be available here once the OpenAPI specification is created.</p>
              <h2>Available Endpoints:</h2>
              <ul>
                <li><strong>GET</strong> /healthz - Health check</li>
                <li><strong>GET</strong> /readyz - Readiness check</li>
                <li><strong>GET</strong> /metrics - Basic metrics</li>
                <li><strong>POST</strong> /api/v1/auth/google - Google authentication</li>
                <li><strong>GET</strong> /api/v1/explore/categories - Content categories</li>
                <li><strong>GET</strong> /api/v1/explore/list - Content list</li>
              </ul>
            </body>
          </html>
        `);
      });
      
      return;
    }
    
    // Load OpenAPI specification
    const swaggerDocument = YAML.load(swaggerPath);
    
    // Swagger UI options
    const swaggerOptions = {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #3b82f6; }
      `,
      customSiteTitle: 'Bedtime Stories API Documentation',
    };
    
    // Serve Swagger UI
    app.use('/docs', swaggerUi.serve);
    app.get('/docs', swaggerUi.setup(swaggerDocument, swaggerOptions));
    
    // Serve raw OpenAPI spec
    app.get('/openapi.yaml', (req, res) => {
      res.setHeader('Content-Type', 'text/yaml');
      res.sendFile(swaggerPath);
    });
    
    app.get('/openapi.json', (req, res) => {
      res.json(swaggerDocument);
    });
    
    logger.info('Swagger documentation loaded successfully at /docs');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to load Swagger documentation');
    
    // Serve error page
    app.get('/docs', (req, res) => {
      res.status(500).send(`
        <html>
          <head><title>API Documentation Error</title></head>
          <body>
            <h1>Documentation Error</h1>
            <p>Failed to load API documentation: ${error.message}</p>
          </body>
        </html>
      `);
    });
  }
}

module.exports = swaggerLoader;
