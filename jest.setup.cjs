// Jest setup file
require('@testing-library/jest-dom')

// Mock environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.SENDGRID_API_KEY = 'test-sendgrid-key'

// Global test timeout
jest.setTimeout(30000)
