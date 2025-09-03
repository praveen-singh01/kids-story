#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * This script runs all tests and validations to ensure the backend API
 * is production-ready.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      production: null,
      coverage: null
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      start: '🚀'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...', 'info');

    // Check if .env file exists
    if (!fs.existsSync(path.join(__dirname, '..', '.env'))) {
      this.log('Creating .env file from .env.example...', 'info');
      try {
        const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
        fs.writeFileSync(path.join(__dirname, '..', '.env'), envExample);
        this.log('Created .env file. Please configure it with your settings.', 'warning');
      } catch (error) {
        this.log('Failed to create .env file. Please create it manually.', 'error');
        throw error;
      }
    }

    // Check if node_modules exists
    if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
      this.log('Installing dependencies...', 'info');
      await this.runCommand('npm', ['install']);
    }

    this.log('Prerequisites check completed', 'success');
  }

  async runUnitTests() {
    this.log('Running unit tests...', 'start');
    
    try {
      await this.runCommand('npm', ['test', '--', '--testPathPattern=tests/', '--verbose']);
      this.results.unit = 'passed';
      this.log('Unit tests passed', 'success');
    } catch (error) {
      this.results.unit = 'failed';
      this.log('Unit tests failed', 'error');
      throw error;
    }
  }

  async runCoverageTests() {
    this.log('Running tests with coverage...', 'start');
    
    try {
      await this.runCommand('npm', ['test', '--', '--coverage', '--coverageReporters=text', '--coverageReporters=lcov']);
      this.results.coverage = 'passed';
      this.log('Coverage tests completed', 'success');
    } catch (error) {
      this.results.coverage = 'failed';
      this.log('Coverage tests failed', 'error');
      // Don't throw here, coverage failure shouldn't stop other tests
    }
  }

  async runLinting() {
    this.log('Running code linting...', 'start');
    
    try {
      await this.runCommand('npm', ['run', 'lint']);
      this.log('Linting passed', 'success');
    } catch (error) {
      this.log('Linting failed', 'warning');
      // Don't throw here, linting failure shouldn't stop tests
    }
  }

  async startServer() {
    this.log('Starting test server...', 'info');
    
    return new Promise((resolve, reject) => {
      const server = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let serverReady = false;
      
      server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('server running') || output.includes('listening')) {
          if (!serverReady) {
            serverReady = true;
            this.log('Test server started', 'success');
            resolve(server);
          }
        }
      });

      server.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Error') || output.includes('error')) {
          this.log(`Server error: ${output}`, 'error');
        }
      });

      server.on('close', (code) => {
        if (!serverReady) {
          reject(new Error(`Server failed to start with exit code ${code}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!serverReady) {
          server.kill();
          reject(new Error('Server startup timeout'));
        }
      }, 30000);
    });
  }

  async runProductionValidation() {
    this.log('Running production readiness validation...', 'start');
    
    try {
      await this.runCommand('node', ['scripts/production-validation.js']);
      this.results.production = 'passed';
      this.log('Production validation passed', 'success');
    } catch (error) {
      this.results.production = 'failed';
      this.log('Production validation failed', 'error');
      throw error;
    }
  }

  async runIntegrationTests() {
    this.log('Running integration tests...', 'start');
    
    let server = null;
    
    try {
      // Start server for integration tests
      server = await this.startServer();
      
      // Wait a bit for server to be fully ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Run integration tests
      await this.runCommand('npm', ['test', '--', '--testPathPattern=integration', '--verbose']);
      
      this.results.integration = 'passed';
      this.log('Integration tests passed', 'success');
      
    } catch (error) {
      this.results.integration = 'failed';
      this.log('Integration tests failed', 'error');
      throw error;
    } finally {
      if (server) {
        this.log('Stopping test server...', 'info');
        server.kill();
        // Wait for server to stop
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  generateReport() {
    this.log('==========================================', 'info');
    this.log('📊 Comprehensive Test Report', 'info');
    this.log('==========================================', 'info');

    const tests = [
      { name: 'Unit Tests', result: this.results.unit },
      { name: 'Integration Tests', result: this.results.integration },
      { name: 'Production Validation', result: this.results.production },
      { name: 'Code Coverage', result: this.results.coverage }
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach(test => {
      if (test.result === 'passed') {
        this.log(`${test.name}: PASSED`, 'success');
        passed++;
      } else if (test.result === 'failed') {
        this.log(`${test.name}: FAILED`, 'error');
        failed++;
      } else {
        this.log(`${test.name}: SKIPPED`, 'warning');
      }
    });

    this.log('==========================================', 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');

    if (failed === 0) {
      this.log('🎉 ALL TESTS PASSED! Backend is production-ready.', 'success');
    } else {
      this.log('❌ SOME TESTS FAILED! Fix issues before deployment.', 'error');
    }

    return failed === 0;
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Backend Testing', 'start');
    this.log('==========================================', 'info');

    try {
      await this.checkPrerequisites();
      
      // Run linting first
      await this.runLinting();
      
      // Run unit tests
      await this.runUnitTests();
      
      // Run coverage tests
      await this.runCoverageTests();
      
      // Run integration tests (with server)
      await this.runIntegrationTests();
      
      // Run production validation
      await this.runProductionValidation();
      
    } catch (error) {
      this.log(`Test execution failed: ${error.message}`, 'error');
    }

    const allPassed = this.generateReport();
    process.exit(allPassed ? 0 : 1);
  }
}

// Usage instructions
function printUsage() {
  console.log(`
📋 Comprehensive Backend Test Runner

Usage:
  node scripts/run-all-tests.js [options]

Options:
  --unit-only       Run only unit tests
  --integration     Run only integration tests  
  --production      Run only production validation
  --coverage        Run tests with coverage report
  --help           Show this help message

Examples:
  node scripts/run-all-tests.js                    # Run all tests
  node scripts/run-all-tests.js --unit-only        # Run only unit tests
  node scripts/run-all-tests.js --coverage         # Run with coverage

Prerequisites:
  - MongoDB running (for integration tests)
  - .env file configured with valid settings
  - All dependencies installed (npm install)

Environment Variables Required:
  - MONGODB_URI: MongoDB connection string
  - GOOGLE_CLIENT_ID: Google OAuth client ID
  - JWT_SECRET: JWT secret key
  - All other variables from .env.example
`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const runner = new TestRunner();

  if (args.includes('--unit-only')) {
    await runner.checkPrerequisites();
    await runner.runUnitTests();
    runner.generateReport();
  } else if (args.includes('--integration')) {
    await runner.checkPrerequisites();
    await runner.runIntegrationTests();
    runner.generateReport();
  } else if (args.includes('--production')) {
    await runner.checkPrerequisites();
    await runner.runProductionValidation();
    runner.generateReport();
  } else if (args.includes('--coverage')) {
    await runner.checkPrerequisites();
    await runner.runCoverageTests();
    runner.generateReport();
  } else {
    await runner.runAllTests();
  }
}

// Export for use in other scripts
module.exports = TestRunner;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}
