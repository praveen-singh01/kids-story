#!/usr/bin/env node

/**
 * Bilingual Content Migration Runner
 * 
 * This script migrates existing content to support bilingual functionality
 * and creates sample bilingual content for testing.
 * 
 * Usage:
 *   npm run migrate:bilingual
 *   or
 *   node scripts/migrate-bilingual.js
 */

const path = require('path');

// Import and run migration
const { runMigration } = require(path.join(__dirname, '../src/scripts/migrate-bilingual-content'));

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Migration interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Migration terminated');
  process.exit(1);
});

// Run the migration
runMigration().catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
