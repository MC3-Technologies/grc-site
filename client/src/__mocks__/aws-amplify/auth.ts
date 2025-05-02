// Mock identity ID for use in tests
let mockIdentityId: string | null = "test-user-id";

// Mock fetch auth session implementation
export const fetchAuthSession = jest.fn(async () => {
  return {
    identityId: mockIdentityId,
    tokens: {
      accessToken: {
        payload: {
          sub: "test-sub",
          email: "test@example.com",
        },
      },
    },
  };
});

// Helper to reset mocks for testing
export const __resetMocks = () => {
  fetchAuthSession.mockClear();
  mockIdentityId = "test-user-id";
};

// Helper to set the mock identity ID
export const __setMockIdentity = (identityId: string | null) => {
  mockIdentityId = identityId;
};

// Helper to simulate auth errors
export const __setMockAuthError = (error: Error) => {
  fetchAuthSession.mockRejectedValueOnce(error);
};

const mockSignOut = jest.fn();
const mockSignIn = jest.fn();
const mockGetCurrentUser = jest.fn();

// Export mock functions
export const signOut = mockSignOut;
export const signIn = mockSignIn;
export const getCurrentUser = mockGetCurrentUser;

// Reset mock function - this is crucial for tests
export const __resetMockAuth = () => {
  mockSignOut.mockClear();
  mockSignIn.mockClear();
  mockGetCurrentUser.mockClear();
};
