// Mock implementation for auth functions
export const fetchAuthSession = jest.fn(async () => {
  return {
    identityId: "test-identity-id",
    tokens: {
      accessToken: {
        payload: {
          "cognito:groups": ["test-group"],
        },
      },
    },
  };
});

// Reset mock function
export const __resetMockAuth = () => {
  fetchAuthSession.mockClear();
};

// Set custom identity for testing
export const __setMockIdentity = (identityId: string) => {
  fetchAuthSession.mockImplementation(async () => {
    return {
      identityId,
      tokens: {
        accessToken: {
          payload: {
            "cognito:groups": ["test-group"],
          },
        },
      },
    };
  });
};
