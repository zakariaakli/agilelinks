#!/usr/bin/env node

/**
 * Local Test Script for Nudge Generation
 *
 * Usage:
 *   node scripts/test-nudge-local.mjs
 *
 * This script:
 * 1. Loads environment variables from .env.local
 * 2. Runs the milestone reminders processing script
 * 3. Generates AI nudges for pending notifications
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Load environment variables from .env.local
config({ path: resolve(projectRoot, '.env.local') });

// Check required environment variables
const required = [
  'FIREBASE_SERVICE_ACCOUNT',
  'NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY',
  'NEXT_PUBLIC_REACT_NDG_GENERATOR_ID',
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  console.error('\nMake sure these are set in your .env.local file');
  process.exit(1);
}

console.log('🚀 Starting local nudge generation test...\n');

// Set up environment for the processing script
const env = {
  ...process.env,
  FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
  OPENAI_API_KEY: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  NEXT_PUBLIC_REACT_NDG_GENERATOR_ID: process.env.NEXT_PUBLIC_REACT_NDG_GENERATOR_ID,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || '',
};

// Run the processing script
const scriptPath = resolve(projectRoot, '.github/scripts/process-milestone-reminders.mjs');

const child = spawn('node', [scriptPath], {
  env,
  stdio: 'inherit',
  cwd: projectRoot,
});

child.on('error', (error) => {
  console.error('❌ Failed to run script:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
