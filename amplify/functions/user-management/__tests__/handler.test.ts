// File: amplify/functions/user-management/__tests__/handler.test.ts
import { AppSyncResolverEvent } from "aws-lambda";
import { handler } from "../handler";
import { userOperations } from "../src/userOperations";

// Define a more complete AppSyncEvent for testing
type AppSyncEvent = {
  typeName?: string;
  fieldName?: string;
  arguments?: any;
  source?: any;
  request?: any;
  info?: any;
  prev?: any;
  stash?: any;
};

// Mock the userOperations module
jest.mock("../src/userOperations", () => ({
  userOperations: {
    listUsers: jest.fn(),
    getUsersByStatus: jest.fn(),
    getUserDetails: jest.fn(),
    getAdminStats: jest.fn(),
    getAuditLogs: jest.fn(),
    approveUser: jest.fn(),
    rejectUser: jest.fn(),
    suspendUser: jest.fn(),
    reactivateUser: jest.fn(),
    createUser: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
    getAllSystemSettings: jest.fn(),
    updateSystemSettings: jest.fn(),
  },
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("User Management Handler", () => {
  describe("handler function", () => {
    test("should handle listUsers operation", async () => {
      // Mock the return value
      const mockUsers = [
        { email: "user1@example.com", status: "APPROVED" },
        { email: "user2@example.com", status: "PENDING" },
      ];
      (userOperations.listUsers as jest.Mock).mockResolvedValue(mockUsers);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Query",
        fieldName: "listUsers",
        arguments: {},
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.listUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    test("should handle getUsersByStatus operation", async () => {
      // Mock the return value
      const mockUsers = [
        { email: "user1@example.com", status: "PENDING" },
        { email: "user2@example.com", status: "PENDING" },
      ];
      (userOperations.getUsersByStatus as jest.Mock).mockResolvedValue(
        mockUsers,
      );

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Query",
        fieldName: "getUsersByStatus",
        arguments: { status: "PENDING" },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.getUsersByStatus).toHaveBeenCalledWith("PENDING");
      expect(result).toEqual(mockUsers);
    });

    test("should handle getUserDetails operation", async () => {
      // Mock the return value
      const mockUser = {
        email: "user@example.com",
        status: "APPROVED",
        firstName: "Test",
        lastName: "User",
      };
      (userOperations.getUserDetails as jest.Mock).mockResolvedValue(mockUser);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Query",
        fieldName: "getUserDetails",
        arguments: { email: "user@example.com" },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.getUserDetails).toHaveBeenCalledWith(
        "user@example.com",
      );
      expect(result).toEqual(mockUser);
    });

    test("should handle getAdminStats operation", async () => {
      // Mock the return value - using a JavaScript object
      const mockStatsObj = {
        users: { total: 5, active: 3, pending: 1, rejected: 0, suspended: 1 },
        assessments: { total: 10, inProgress: 2, completed: 8 },
      };

      // Convert to JSON string since that's what your actual implementation returns
      const mockStatsString = JSON.stringify(mockStatsObj);

      // Mock getAdminStats to return a JSON string, matching your implementation
      (userOperations.getAdminStats as jest.Mock).mockResolvedValue(
        mockStatsString,
      );

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Query",
        fieldName: "getAdminStats",
        arguments: {},
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.getAdminStats).toHaveBeenCalled();

      // Handle potentially double-stringified JSON
      let parsedResult;
      try {
        // First, try to parse the result - this handles if it's a regular JSON string
        parsedResult = JSON.parse(result);

        // If the parsed result is still a string, try parsing again
        if (typeof parsedResult === "string") {
          parsedResult = JSON.parse(parsedResult);
        }
      } catch (error) {
        console.error("Error parsing result:", error);
        // If parsing fails, use the original result
        parsedResult = result;
      }

      // Now compare with the original object
      expect(parsedResult).toEqual(mockStatsObj);
    });

    test("should handle approveUser operation", async () => {
      // Mock the return value
      (userOperations.approveUser as jest.Mock).mockResolvedValue(true);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Mutation",
        fieldName: "approveUser",
        arguments: {
          email: "user@example.com",
          adminEmail: "admin@example.com",
        },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.approveUser).toHaveBeenCalledWith(
        "user@example.com",
        "admin@example.com",
      );
      expect(result).toBe(true);
    });

    test("should handle rejectUser operation", async () => {
      // Mock the return value
      (userOperations.rejectUser as jest.Mock).mockResolvedValue(true);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Mutation",
        fieldName: "rejectUser",
        arguments: {
          email: "user@example.com",
          reason: "Application rejected",
          adminEmail: "admin@example.com",
        },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.rejectUser).toHaveBeenCalledWith(
        "user@example.com",
        "Application rejected",
        "admin@example.com",
      );
      expect(result).toBe(true);
    });

    test("should handle suspendUser operation", async () => {
      // Mock the return value
      (userOperations.suspendUser as jest.Mock).mockResolvedValue(true);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Mutation",
        fieldName: "suspendUser",
        arguments: {
          email: "user@example.com",
          reason: "Terms violation",
          adminEmail: "admin@example.com",
        },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.suspendUser).toHaveBeenCalledWith(
        "user@example.com",
        "Terms violation",
        "admin@example.com",
      );
      expect(result).toBe(true);
    });

    test("should handle reactivateUser operation", async () => {
      // Mock the return value
      (userOperations.reactivateUser as jest.Mock).mockResolvedValue(true);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Mutation",
        fieldName: "reactivateUser",
        arguments: {
          email: "user@example.com",
          adminEmail: "admin@example.com",
        },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.reactivateUser).toHaveBeenCalledWith(
        "user@example.com",
        "admin@example.com",
      );
      expect(result).toBe(true);
    });

    test("should handle createUser operation", async () => {
      // Mock the return value
      (userOperations.createUser as jest.Mock).mockResolvedValue(true);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Mutation",
        fieldName: "createUser",
        arguments: {
          email: "newuser@example.com",
          role: "StandardUser",
          sendEmail: true,
          adminEmail: "admin@example.com",
        },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.createUser).toHaveBeenCalledWith(
        "newuser@example.com",
        "StandardUser",
        true,
        "admin@example.com",
        undefined, // firstName
        undefined, // lastName
        undefined, // companyName
      );
      expect(result).toBe(true);
    });

    test("should handle updateUserRole operation", async () => {
      // Mock the return value
      (userOperations.updateUserRole as jest.Mock).mockResolvedValue(true);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Mutation",
        fieldName: "updateUserRole",
        arguments: {
          email: "user@example.com",
          role: "AdminUser",
          adminEmail: "admin@example.com",
        },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.updateUserRole).toHaveBeenCalledWith(
        "user@example.com",
        "AdminUser",
        "admin@example.com",
      );
      expect(result).toBe(true);
    });

    test("should handle deleteUser operation", async () => {
      // Mock the return value
      (userOperations.deleteUser as jest.Mock).mockResolvedValue(true);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Mutation",
        fieldName: "deleteUser",
        arguments: {
          email: "user@example.com",
          adminEmail: "admin@example.com",
        },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.deleteUser).toHaveBeenCalledWith(
        "user@example.com",
        "admin@example.com",
      );
      expect(result).toBe(true);
    });

    test("should handle getAllSystemSettings operation", async () => {
      // Mock the return value
      const mockSettings = [
        { id: "setting1", name: "Setting 1", value: true },
        { id: "setting2", name: "Setting 2", value: 10 },
      ];
      (userOperations.getAllSystemSettings as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Query",
        fieldName: "getAllSystemSettings",
        arguments: {},
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.getAllSystemSettings).toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
    });

    test("should handle updateSystemSettingsConfig operation", async () => {
      // Mock the return value
      (userOperations.updateSystemSettings as jest.Mock).mockResolvedValue(
        true,
      );

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Mutation",
        fieldName: "updateSystemSettingsConfig",
        arguments: {
          settings: [{ id: "setting1", name: "Setting 1", value: false }],
          updatedBy: "admin@example.com",
        },
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the results
      expect(userOperations.updateSystemSettings).toHaveBeenCalledWith(
        [{ id: "setting1", name: "Setting 1", value: false }],
        "admin@example.com",
      );
      expect(result).toBe(true);
    });

    test("should handle unknown operation", async () => {
      // Mock the return value for default case
      (userOperations.listUsers as jest.Mock).mockResolvedValue([]);

      // Create the event with unknown operation
      const event: AppSyncEvent = {
        typeName: "Query",
        fieldName: "unknownOperation",
        arguments: {},
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the function defaults to listUsers
      expect(userOperations.listUsers).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    test("should handle errors gracefully", async () => {
      // Mock an error
      const error = new Error("Test error");
      (userOperations.listUsers as jest.Mock).mockRejectedValue(error);

      // Create the event
      const event: AppSyncEvent = {
        typeName: "Query",
        fieldName: "listUsers",
        arguments: {},
      };

      // Call the handler
      const result = await handler(event as any);

      // Verify the error handling
      expect(result).toHaveProperty("statusCode", 500);
      expect(result).toHaveProperty("body");

      // Parse the body to check the error message
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty(
        "message",
        "Error executing operation: Test error",
      );
    });
  });
});
