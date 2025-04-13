import {
  fetchUsers,
  fetchUsersByStatus,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  deleteUser,
  getUserDetails,
} from "../adminUser";

// Mock localStorage since it's not available in Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

// Mock cognitoConfig before importing anything that might use it
jest.mock("../cognitoConfig", () => ({
  getCognitoConfig: jest.fn().mockReturnValue({
    userPoolId: "test-user-pool-id",
    region: "us-east-1",
    clientId: "test-client-id",
  }),
}));

// Mock the client schema with error responses for testing error paths
jest.mock("../../amplify/schema", () => ({
  getClientSchema: jest.fn(() => ({
    queries: {
      listUsers: jest.fn().mockRejectedValue(new Error("Network error")),
      getUsersByStatus: jest.fn().mockRejectedValue(new Error("API failure")),
      getUserDetails: jest.fn().mockRejectedValue(new Error("Server error")),
      getAdminStats: jest.fn().mockRejectedValue(new Error("Stats API error")),
    },
    mutations: {
      approveUser: jest
        .fn()
        .mockRejectedValue(new Error("Failed to approve user")),
      rejectUser: jest
        .fn()
        .mockRejectedValue(new Error("Failed to reject user")),
      suspendUser: jest
        .fn()
        .mockRejectedValue(new Error("Failed to suspend user")),
      reactivateUser: jest
        .fn()
        .mockRejectedValue(new Error("Failed to reactivate user")),
      deleteUser: jest
        .fn()
        .mockRejectedValue(new Error("Failed to delete user")),
    },
    models: {
      InProgressAssessment: {
        get: jest.fn().mockRejectedValue(new Error("Failed to get assessment")),
      },
    },
  })),
}));

describe("Admin User API Error Handling", () => {
  // Setup and teardown for mocks
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    // Mock console.error and console.log to suppress expected logs in tests
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore all mocks, including console.error
    jest.restoreAllMocks();
  });

  describe("fetchUsers error handling", () => {
    test("should handle API failure gracefully", async () => {
      const users = await fetchUsers();
      // Should return empty array when API fails
      expect(users).toEqual([]);
    });

    test("should handle API failure even with forced refresh", async () => {
      const users = await fetchUsers(true);
      // Should return empty array when API fails even with forced refresh
      expect(users).toEqual([]);
    });
  });

  describe("fetchUsersByStatus error handling", () => {
    test("should handle API failure gracefully", async () => {
      const users = await fetchUsersByStatus("pending");
      // Should return empty array when API fails
      expect(users).toEqual([]);
    });

    test("should handle API failure with forced refresh", async () => {
      const users = await fetchUsersByStatus("active", true);
      // Should return empty array when API fails with forced refresh
      expect(users).toEqual([]);
    });
  });

  describe("getUserDetails error handling", () => {
    test("should handle API failure gracefully", async () => {
      const user = await getUserDetails("test@example.com");
      // Should return empty object when API fails
      expect(user).toEqual({});
    });
  });

  describe("approveUser error handling", () => {
    test("should return false when API call fails", async () => {
      const result = await approveUser("test@example.com");
      // Should return false to indicate failure
      expect(result).toBe(false);
    });

    test("should return false when API call fails with admin email", async () => {
      const result = await approveUser("test@example.com", "admin@example.com");
      // Should return false to indicate failure
      expect(result).toBe(false);
    });
  });

  describe("rejectUser error handling", () => {
    test("should return false when API call fails", async () => {
      const result = await rejectUser("test@example.com");
      // Should return false to indicate failure
      expect(result).toBe(false);
    });

    test("should return false when API call fails with reason and admin email", async () => {
      const result = await rejectUser(
        "test@example.com",
        "Not a valid user",
        "admin@example.com",
      );
      // Should return false to indicate failure
      expect(result).toBe(false);
    });
  });

  describe("suspendUser error handling", () => {
    test("should return false when API call fails", async () => {
      const result = await suspendUser("test@example.com");
      // Should return false to indicate failure
      expect(result).toBe(false);
    });

    test("should return false when API call fails with reason and admin email", async () => {
      const result = await suspendUser(
        "test@example.com",
        "Violation of terms",
        "admin@example.com",
      );
      // Should return false to indicate failure
      expect(result).toBe(false);
    });
  });

  describe("reactivateUser error handling", () => {
    test("should return false when API call fails", async () => {
      const result = await reactivateUser("test@example.com");
      // Should return false to indicate failure
      expect(result).toBe(false);
    });

    test("should return false when API call fails with admin email", async () => {
      const result = await reactivateUser(
        "test@example.com",
        "admin@example.com",
      );
      // Should return false to indicate failure
      expect(result).toBe(false);
    });
  });

  describe("deleteUser error handling", () => {
    test("should return error object when API call fails", async () => {
      const result = await deleteUser("test@example.com");
      // Should return object with success=false and error message
      expect(result).toEqual({
        success: false,
        message: expect.stringContaining("Failed to delete user"),
      });
    });

    test("should return error object when API call fails with admin email", async () => {
      const result = await deleteUser("test@example.com", "admin@example.com");
      // Should return object with success=false and error message
      expect(result).toEqual({
        success: false,
        message: expect.stringContaining("Failed to delete user"),
      });
    });
  });
});
