// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Test file for cognitoAdmin.ts
 * 
 * Note: TypeScript checking is completely disabled for this file 
 * because it's challenging to properly type the AWS SDK mocks
 * without adding significant complexity.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// The actual implementations used by the module we're testing
let mockListUsersCommandImpl;
let mockAdminGetUserCommandImpl;
let mockAdminConfirmSignUpCommandImpl;
let mockAdminEnableUserCommandImpl;
let mockAdminUpdateUserAttributesCommandImpl;
let mockAdminAddUserToGroupCommandImpl;
let mockSendImpl;

// Mock the AWS SDK client - must be done before imports
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  // Create the mock command classes
  mockListUsersCommandImpl = jest.fn().mockImplementation(params => ({ params }));
  mockAdminGetUserCommandImpl = jest.fn().mockImplementation(params => ({ params }));
  mockAdminConfirmSignUpCommandImpl = jest.fn().mockImplementation(params => ({ params }));
  mockAdminEnableUserCommandImpl = jest.fn().mockImplementation(params => ({ params }));
  mockAdminUpdateUserAttributesCommandImpl = jest.fn().mockImplementation(params => ({ params }));
  mockAdminAddUserToGroupCommandImpl = jest.fn().mockImplementation(params => ({ params }));
  
  // Create the mock send function
  mockSendImpl = jest.fn();
  
  // Return mock implementations
  return {
    // These must be constructor functions to match what the AWS SDK client expects
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
      send: mockSendImpl
    })),
    ListUsersCommand: mockListUsersCommandImpl,
    AdminGetUserCommand: mockAdminGetUserCommandImpl,
    AdminConfirmSignUpCommand: mockAdminConfirmSignUpCommandImpl,
    AdminEnableUserCommand: mockAdminEnableUserCommandImpl,
    AdminUpdateUserAttributesCommand: mockAdminUpdateUserAttributesCommandImpl,
    AdminAddUserToGroupCommand: mockAdminAddUserToGroupCommandImpl,
    AdminCreateUserCommand: jest.fn().mockImplementation(params => ({ params })),
    AdminDisableUserCommand: jest.fn().mockImplementation(params => ({ params })),
    MessageActionType: {
      RESEND: 'RESEND',
      SUPPRESS: 'SUPPRESS'
    }
  };
});

// Mock the cognitoConfig module
jest.mock('../cognitoConfig', () => ({
  getCognitoConfig: jest.fn().mockReturnValue({
    userPoolId: 'test-user-pool-id',
    region: 'us-east-1',
    clientId: 'test-client-id'
  })
}));

// Mock the adminUser module for development mode
jest.mock('../adminUser', () => ({
  getMockUsers: jest.fn().mockReturnValue([
    {
      id: 'user1',
      email: 'user1@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      status: 'CONFIRMED',
      enabled: true,
      created: '2023-01-01T00:00:00Z',
      lastModified: '2023-01-01T00:00:00Z'
    },
    {
      id: 'user2',
      email: 'user2@example.com',
      firstName: 'Another',
      lastName: 'User',
      role: 'user',
      status: 'FORCE_CHANGE_PASSWORD',
      enabled: true,
      created: '2023-01-02T00:00:00Z',
      lastModified: '2023-01-02T00:00:00Z'
    }
  ]),
  getFilteredMockUsers: jest.fn().mockImplementation((status) => {
    if (status === 'pending') {
      return [{
        id: 'user2',
        email: 'user2@example.com',
        firstName: 'Another',
        lastName: 'User',
        role: 'user',
        status: 'FORCE_CHANGE_PASSWORD',
        enabled: true,
        created: '2023-01-02T00:00:00Z',
        lastModified: '2023-01-02T00:00:00Z'
      }];
    }
    return [];
  })
}));

// Import after all mocks are set up
import {
  initCognitoClient,
  listAllUsers,
  getUsersByStatus,
  getUserDetails,
  approveUser,
} from '../cognitoAdmin';

describe('Cognito Admin Utils', () => {
  // Store original NODE_ENV and console methods
  const originalNodeEnv = process.env.NODE_ENV;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock functions
    mockSendImpl.mockReset();
    mockListUsersCommandImpl.mockClear();
    mockAdminGetUserCommandImpl.mockClear();
    mockAdminConfirmSignUpCommandImpl.mockClear();
    mockAdminEnableUserCommandImpl.mockClear();
    mockAdminUpdateUserAttributesCommandImpl.mockClear();
    
    // Mock console methods to prevent noise
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Reset environment 
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  afterAll(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Restore environment
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  describe('initCognitoClient', () => {
    it('should initialize the Cognito client with correct config', () => {
      const { client, userPoolId } = initCognitoClient();
      
      expect(client).toBeDefined();
      expect(userPoolId).toBe('test-user-pool-id');
    });
    
    it('should reuse the existing client if already initialized', () => {
      const firstInit = initCognitoClient();
      const secondInit = initCognitoClient();
      
      expect(firstInit.client).toBe(secondInit.client);
    });
  });
  
  describe('listAllUsers', () => {
    it('should return mock data in development mode', async () => {
      // Set development mode
      process.env.NODE_ENV = 'development';
      
      const users = await listAllUsers();
      
      // Should return mock users without calling AWS
      expect(users.length).toBe(2);
      expect(users[0].email).toBe('user1@example.com');
      expect(users[1].email).toBe('user2@example.com');
    });
    
    it('should call Cognito API in production mode', async () => {
      // Set production mode
      process.env.NODE_ENV = 'production';
      
      // Mock the Cognito API response
      mockSendImpl.mockResolvedValueOnce({
        Users: [
          {
            Username: 'user1@example.com',
            Attributes: [
              { Name: 'email', Value: 'user1@example.com' },
              { Name: 'given_name', Value: 'Test' },
              { Name: 'family_name', Value: 'User' }
            ],
            UserStatus: 'CONFIRMED',
            Enabled: true
          }
        ]
      });
      
      const users = await listAllUsers();
      
      // Should call AWS SDK
      expect(mockSendImpl).toHaveBeenCalled();
      expect(mockListUsersCommandImpl).toHaveBeenCalledWith(
        expect.objectContaining({
          UserPoolId: 'test-user-pool-id'
        })
      );
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('user1@example.com');
    });
    
    it('should handle errors gracefully', async () => {
      // Set production mode
      process.env.NODE_ENV = 'production';
      
      // Mock the Cognito API to throw an error
      mockSendImpl.mockRejectedValueOnce(new Error('AWS API error'));
      
      // Should throw the error
      await expect(listAllUsers()).rejects.toThrow('AWS API error');
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error listing users:'),
        expect.any(Error)
      );
    });
  });
  
  describe('getUsersByStatus', () => {
    it('should return filtered mock users in development mode', async () => {
      // Set development mode
      process.env.NODE_ENV = 'development';
      
      const users = await getUsersByStatus('pending');
      
      // Should return filtered mock users
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('user2@example.com');
    });
    
    it('should use correct filter string for pending status', async () => {
      // Set production mode
      process.env.NODE_ENV = 'production';
      
      // Mock the Cognito API response
      mockSendImpl.mockResolvedValueOnce({
        Users: [
          {
            Username: 'user2@example.com',
            Attributes: [
              { Name: 'email', Value: 'user2@example.com' }
            ],
            UserStatus: 'FORCE_CHANGE_PASSWORD',
            Enabled: true
          }
        ]
      });
      
      await getUsersByStatus('pending');
      
      // Verify the correct filter was used
      expect(mockListUsersCommandImpl).toHaveBeenCalledWith(
        expect.objectContaining({
          Filter: 'cognito:user_status = "FORCE_CHANGE_PASSWORD"'
        })
      );
    });
    
    it('should filter suspended users by enabled status', async () => {
      // Set production mode
      process.env.NODE_ENV = 'production';
      
      // Mock the Cognito API response
      mockSendImpl.mockResolvedValueOnce({
        Users: [
          {
            Username: 'user1@example.com',
            Attributes: [
              { Name: 'email', Value: 'user1@example.com' }
            ],
            UserStatus: 'CONFIRMED',
            Enabled: true
          },
          {
            Username: 'user2@example.com',
            Attributes: [
              { Name: 'email', Value: 'user2@example.com' }
            ],
            UserStatus: 'CONFIRMED',
            Enabled: false
          }
        ]
      });
      
      const users = await getUsersByStatus('suspended');
      
      // Should only include the disabled user
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('user2@example.com');
      expect(users[0].enabled).toBe(false);
    });
  });
  
  describe('getUserDetails', () => {
    it('should return mock user details in development mode', async () => {
      // Set development mode
      process.env.NODE_ENV = 'development';
      
      const user = await getUserDetails('user1@example.com');
      
      // Should return mock user
      expect(user.email).toBe('user1@example.com');
      expect(user.firstName).toBe('Test');
    });
    
    it('should call Cognito API in production mode', async () => {
      // Set production mode
      process.env.NODE_ENV = 'production';
      
      // Mock the Cognito API response
      mockSendImpl.mockResolvedValueOnce({
        Username: 'user1@example.com',
        UserAttributes: [
          { Name: 'email', Value: 'user1@example.com' },
          { Name: 'given_name', Value: 'Test' },
          { Name: 'family_name', Value: 'User' },
          { Name: 'custom:role', Value: 'admin' }
        ]
      });
      
      const user = await getUserDetails('user1@example.com');
      
      // Verify AWS SDK called with correct parameters
      expect(mockAdminGetUserCommandImpl).toHaveBeenCalledWith({
        UserPoolId: 'test-user-pool-id',
        Username: 'user1@example.com'
      });
      
      // Verify user details
      expect(user.email).toBe('user1@example.com');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.role).toBe('admin');
    });
    
    it('should handle non-existent users gracefully', async () => {
      // Set production mode
      process.env.NODE_ENV = 'production';
      
      // Mock the Cognito API to throw an error
      mockSendImpl.mockRejectedValueOnce(new Error('User does not exist'));
      
      const user = await getUserDetails('nonexistent@example.com');
      
      // Should return empty user object
      expect(user).toEqual({});
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching user details'),
        expect.any(Error)
      );
    });
  });
  
  describe('approveUser', () => {
    it('should return success in development mode', async () => {
      // Set development mode
      process.env.NODE_ENV = 'development';
      
      const result = await approveUser('user@example.com');
      
      // Should return success without calling AWS
      expect(result).toBe(true);
    });
    
    it('should call multiple Cognito API commands in production mode', async () => {
      // Set production mode
      process.env.NODE_ENV = 'production';
      
      // Mock the Cognito API responses
      mockSendImpl.mockResolvedValue({});
      
      const result = await approveUser('user@example.com');
      
      // We expect multiple calls to mockSendImpl (confirm, enable, update attributes)
      expect(mockSendImpl.mock.calls.length).toBeGreaterThanOrEqual(3);
      
      // Verify result
      expect(result).toBe(true);
    });
  });
}); 