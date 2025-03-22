// Mock for import.meta
export default {
  env: {
    // Vite environment variables that can be used in tests
    VITE_USER_POOL_ID: process.env.VITE_USER_POOL_ID || 'test-user-pool-id',
    VITE_AWS_REGION: process.env.VITE_AWS_REGION || 'test-region',
    VITE_CLIENT_ID: process.env.VITE_CLIENT_ID || 'test-client-id',
    VITE_IDENTITY_POOL_ID: process.env.VITE_IDENTITY_POOL_ID || 'test-identity-pool-id',
    // Add other environment variables as needed
    MODE: 'test',
    DEV: true
  }
}; 