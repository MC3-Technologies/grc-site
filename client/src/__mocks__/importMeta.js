// Mock for import.meta
const importMeta = {
  env: {
    MODE: 'test',
    DEV: true,
    PROD: false,
    SSR: false,
    BASE_URL: '/',
    VITE_API_URL: 'http://localhost:3000',
    VITE_USER_POOL_ID: 'test-user-pool-id',
    VITE_CLIENT_ID: 'test-client-id',
    VITE_IDENTITY_POOL_ID: 'test-identity-pool-id',
    VITE_AWS_REGION: 'us-east-1'
  },
  url: 'http://localhost:3000'
};

export default importMeta;
