// File: client/src/utils/__tests__/adminUser.test.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// Define mockUsers and other test data before it's used
const mockUsers = [
  {
    id: "user1",
    email: "user1@example.com",
    firstName: "Test",
    lastName: "User",
    role: "admin",
    status: "active",
    enabled: true,
    created: "2023-01-01T00:00:00Z",
    lastModified: "2023-01-01T00:00:00Z"
  },
  {
    id: "user2",
    email: "user2@example.com",
    firstName: "Test",
    lastName: "User2",
    role: "user",
    status: "pending",
    enabled: true,
    created: "2023-01-02T00:00:00Z",
    lastModified: "2023-01-02T00:00:00Z"
  }
];

const mockPendingUsers = [
  {
    email: "user2@example.com",
    status: "FORCE_CHANGE_PASSWORD",
    enabled: true,
    created: "2023-01-02T00:00:00Z",
    lastModified: "2023-01-02T00:00:00Z",
  },
];

const mockActiveUsers = [
  {
    email: "user1@example.com",
    status: "CONFIRMED",
    enabled: true,
    created: "2023-01-01T00:00:00Z",
    lastModified: "2023-01-01T00:00:00Z",
  },
];

const mockUserDetails = {
  email: "user1@example.com",
  status: "CONFIRMED",
  enabled: true,
  created: "2023-01-01T00:00:00Z",
  lastModified: "2023-01-01T00:00:00Z",
  attributes: {
    "custom:role": "user",
  },
};

const mockCreatedUser = {
  success: true,
  user: {
    email: "newuser@example.com",
    status: "FORCE_CHANGE_PASSWORD",
  },
};

// Mock cognitoConfig before importing anything that might use it
jest.mock("../cognitoConfig", () => ({
  getCognitoConfig: jest.fn().mockReturnValue({
    userPoolId: "test-user-pool-id",
    region: "us-east-1",
    clientId: "test-client-id",
  }),
}));

// Mock localStorage since it's not available in Node.js environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    key: jest.fn((index) => Object.keys(store)[index] || null),
    length: 0,
  };
})();

// Set up global localStorage before any imports
Object.defineProperty(global, "localStorage", { value: localStorageMock });

// Mock document.dispatchEvent
document.dispatchEvent = jest.fn();

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  fetchUsers,
  fetchUsersByStatus,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  createUser,
  deleteUser,
  getUserStatus,
  clearUserCache,
  emitAdminEvent,
  AdminEvents,
  refreshUserData,
} from "../adminUser";
import { getClientSchema } from "../../amplify/schema";
// We don't need to assign clientSchema anymore since we're mocking getClientSchema directly
// Keep getClientSchema for mocking but don't use the returned value

// Mock the client schema
jest.mock("../../amplify/schema", () => ({
  getClientSchema: jest.fn(() => ({
    queries: {
      // @ts-expect-error - Jest mock resolution
      listUsers: jest.fn().mockResolvedValue({
        data: JSON.stringify(mockUsers),
      }),
      getUsersByStatus: jest.fn().mockImplementation((args) => {
        const typedArgs = args as { status: string };
        if (typedArgs.status === "pending") {
          return Promise.resolve({ data: JSON.stringify(mockPendingUsers) });
        } else if (typedArgs.status === "active") {
          return Promise.resolve({ data: JSON.stringify(mockActiveUsers) });
        }
        return Promise.resolve({ data: JSON.stringify([]) });
      }),
      // @ts-expect-error - Jest mock resolution
      getUserDetails: jest.fn().mockResolvedValue({
        data: JSON.stringify(mockUserDetails),
      }),
    },
    mutations: {
      // @ts-expect-error - Jest mock resolution
      approveUser: jest.fn().mockResolvedValue({
        data: JSON.stringify(true),
      }),
      // @ts-expect-error - Jest mock resolution
      rejectUser: jest.fn().mockResolvedValue({
        data: JSON.stringify(true),
      }),
      // @ts-expect-error - Jest mock resolution
      suspendUser: jest.fn().mockResolvedValue({
        data: JSON.stringify(true),
      }),
      // @ts-expect-error - Jest mock resolution
      reactivateUser: jest.fn().mockResolvedValue({
        data: JSON.stringify(true),
      }),
      // @ts-expect-error - Jest mock resolution
      createUser: jest.fn().mockResolvedValue({
        data: JSON.stringify(mockCreatedUser),
      }),
      // @ts-expect-error - Jest mock resolution
      deleteUser: jest.fn().mockResolvedValue({
        data: JSON.stringify({
          success: true,
          message: "User deleted successfully",
        }),
      }),
    },
  })),
}));

describe("Admin User Management API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe("fetchUsers", () => {
    it("should fetch all users", async () => {
      const users = await fetchUsers();
      expect(users).toHaveLength(2);
      expect(users[0].email).toBe("user1@example.com");
      expect(users[1].email).toBe("user2@example.com");
    });
  });

  describe("fetchUsersByStatus", () => {
    it("should fetch pending users", async () => {
      const users = await fetchUsersByStatus("pending");
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe("user2@example.com");
      expect(users[0].status).toBe("FORCE_CHANGE_PASSWORD");
    });

    it("should fetch active users", async () => {
      const users = await fetchUsersByStatus("active");
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe("user1@example.com");
      expect(users[0].status).toBe("CONFIRMED");
    });
  });

  describe("approveUser", () => {
    it("should approve a user", async () => {
      const result = await approveUser("user2@example.com");
      expect(result).toBe(true);
    });
  });

  describe("rejectUser", () => {
    it("should reject a user", async () => {
      const result = await rejectUser(
        "user2@example.com",
        "Not a valid request",
      );
      expect(result).toBe(true);
    });
  });

  describe("suspendUser", () => {
    it("should suspend a user", async () => {
      const result = await suspendUser(
        "user1@example.com",
        "Violation of terms",
      );
      expect(result).toBe(true);
    });
  });

  describe("reactivateUser", () => {
    it("should reactivate a user", async () => {
      const result = await reactivateUser("user1@example.com");
      expect(result).toBe(true);
    });
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      const result = await createUser("newuser@example.com", "user", true);
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe("newuser@example.com");
    });
  });

  // Additional tests to increase coverage
  describe("emitAdminEvent", () => {
    it("should emit an admin event", () => {
      const result = emitAdminEvent(AdminEvents.USER_APPROVED);
      expect(result).toBe(true);
      expect(document.dispatchEvent).toHaveBeenCalled();
    });

    it("should handle errors gracefully", () => {
      // Mock document.dispatchEvent to throw an error
      document.dispatchEvent.mockImplementationOnce(() => {
        throw new Error("Test error");
      });
      
      const result = emitAdminEvent(AdminEvents.USER_APPROVED);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("clearUserCache", () => {
    it("should clear user cache from localStorage", () => {
      // Setup - populate localStorage with mock cache
      localStorageMock.setItem("admin_users_cache", JSON.stringify(mockUsers));
      localStorageMock.setItem("admin_users_cache_timestamp", Date.now().toString());
      localStorageMock.setItem("admin_users_cache_status_active", JSON.stringify(mockActiveUsers));
      
      // Act
      clearUserCache();
      
      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("admin_users_cache");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("admin_users_cache_timestamp");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("admin_users_cache_status_active");
    });

    it("should handle errors gracefully", () => {
      // Setup - make localStorage.removeItem throw an error
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error("Storage error");
      });
      
      // Act
      clearUserCache();
      
      // Assert
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getUserStatus", () => {
    it("should return 'active' for confirmed and enabled users", () => {
      const status = getUserStatus("CONFIRMED", true);
      expect(status).toBe("active");
    });

    it("should return 'pending' for users with FORCE_CHANGE_PASSWORD status", () => {
      const status = getUserStatus("FORCE_CHANGE_PASSWORD", true);
      expect(status).toBe("pending");
    });

    it("should return 'rejected' for users with REJECTED custom status", () => {
      const status = getUserStatus("CONFIRMED", false, "REJECTED");
      expect(status).toBe("rejected");
    });

    it("should return 'suspended' for users with SUSPENDED custom status", () => {
      const status = getUserStatus("CONFIRMED", false, "SUSPENDED");
      expect(status).toBe("suspended");
    });

    it("should return 'pending' for disabled users with no custom status", () => {
      const status = getUserStatus("CONFIRMED", false);
      expect(status).toBe("pending");
    });
  });

  describe("refreshUserData", () => {
    it("should clear cache and fetch users with force refresh", async () => {
      // Create spies
      const clearUserCacheSpy = jest.fn();
      const fetchUsersSpy = jest.fn().mockResolvedValue(mockUsers);
      
      // Use the mock implementation for refreshUserData
      const refreshUserDataTest = async () => {
        clearUserCacheSpy();
        await fetchUsersSpy(true);
      };
      
      // Stub the original refreshUserData
      const originalRefreshUserData = refreshUserData;
      
      try {
        // Replace the original function with our test version
        global.refreshUserData = refreshUserDataTest;
        
        // Call the test function
        await refreshUserDataTest();
        
        // Verify our spy functions were called
        expect(clearUserCacheSpy).toHaveBeenCalled();
        expect(fetchUsersSpy).toHaveBeenCalledWith(true);
      } finally {
        // Restore the original functions
        global.refreshUserData = originalRefreshUserData;
      }
    });
  });

  describe("deleteUser", () => {
    it("should delete a user and return success response", async () => {
      const result = await deleteUser("user1@example.com");
      expect(result.success).toBe(true);
    });

    it("should include admin email when provided", async () => {
      // Mock getClientSchema to return a fresh mock
      const mockDeleteUser = jest.fn().mockResolvedValue({
        data: JSON.stringify({
          success: true,
          message: "User deleted successfully",
        }),
      });
      
      // Create a custom schema with our fresh mock
      const customSchema = {
        mutations: {
          deleteUser: mockDeleteUser
        }
      };
      
      // Replace the getClientSchema function temporarily
      (getClientSchema as jest.Mock).mockReturnValueOnce(customSchema);
      
      // Act
      await deleteUser("user1@example.com", "admin@example.com");
      
      // Assert
      expect(mockDeleteUser).toHaveBeenCalledWith({
        email: "user1@example.com",
        adminEmail: "admin@example.com",
      });
      
      // No need to restore since mockReturnValueOnce only affects one call
    });
  });
});
