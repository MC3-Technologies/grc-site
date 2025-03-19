// File: client/src/utils/__tests__/adminUser.test.ts
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  fetchUsers,
  fetchUsersByStatus,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  createUser,
  User,
  CreateUserResult,
} from "../adminUser";

// Define mocked user data with proper types
const mockUsers: User[] = [
  {
    email: "user1@example.com",
    status: "CONFIRMED",
    enabled: true,
    created: "2023-01-01T00:00:00Z",
    lastModified: "2023-01-01T00:00:00Z",
  },
  {
    email: "user2@example.com",
    status: "FORCE_CHANGE_PASSWORD",
    enabled: true,
    created: "2023-01-02T00:00:00Z",
    lastModified: "2023-01-02T00:00:00Z",
  },
];

const mockPendingUsers: User[] = [
  {
    email: "user2@example.com",
    status: "FORCE_CHANGE_PASSWORD",
    enabled: true,
    created: "2023-01-02T00:00:00Z",
    lastModified: "2023-01-02T00:00:00Z",
  },
];

const mockActiveUsers: User[] = [
  {
    email: "user1@example.com",
    status: "CONFIRMED",
    enabled: true,
    created: "2023-01-01T00:00:00Z",
    lastModified: "2023-01-01T00:00:00Z",
  },
];

const mockUserDetails: User = {
  email: "user1@example.com",
  status: "CONFIRMED",
  enabled: true,
  created: "2023-01-01T00:00:00Z",
  lastModified: "2023-01-01T00:00:00Z",
  attributes: {
    "custom:role": "user",
  },
};

const mockCreatedUser: CreateUserResult = {
  success: true,
  user: {
    email: "newuser@example.com",
    status: "FORCE_CHANGE_PASSWORD",
  },
};

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
    },
  })),
}));

describe("Admin User Management API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
