// File: client/src/utils/adminUser.ts
import { getClientSchema } from "../amplify/schema";
//import { useState, useEffect } from "react";

// Define AdminUser interface to match the one in types.d.ts
interface AdminUser {
  emitAdminEvent: (type: string, data?: unknown) => boolean;
  AdminEvents: Record<string, string>;
  clearAdminStatsCache: () => void;
  clearUserCache: () => void;
}

// Export the getClientSchema for use in components
export { getClientSchema };

// Set this to false to use real data from the API
const USE_MOCK_DATA = false;

// Define constants for user caching
const USER_CACHE_KEY = "userCache";
const USER_CACHE_TIMESTAMP_KEY = "userCacheTimestamp";
const USER_CACHE_BY_STATUS_PREFIX = "userCacheByStatus_";
const CACHE_DURATION_MS = 300000; // 5 minutes
const ADMIN_STATS_CACHE_KEY = "adminStatsCache";
const ADMIN_STATS_CACHE_TIMESTAMP_KEY = "adminStatsCacheTimestamp";

// Define admin events enum for consistent event types
export const AdminEvents = {
  USER_CREATED: "USER_CREATED",
  // USER_UPDATED: "USER_UPDATED", // Removed - Use USER_PROFILE_UPDATED or USER_ROLE_UPDATED
  USER_PROFILE_UPDATED: "USER_PROFILE_UPDATED", // Ensure this exists if it's the correct action key
  USER_DELETED: "USER_DELETED",
  USER_APPROVED: "USER_APPROVED",
  USER_REJECTED: "USER_REJECTED",
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_REACTIVATED: "USER_REACTIVATED",
  USER_ROLE_UPDATED: "USER_ROLE_UPDATED",
  ASSESSMENT_CREATED: "ASSESSMENT_CREATED",
  ASSESSMENT_COMPLETED: "ASSESSMENT_COMPLETED",
  ASSESSMENT_DELETED: "ASSESSMENT_DELETED",
};

// Function to emit admin events
export const emitAdminEvent = (eventType: string): boolean => {
  try {
    //console.log(`Emitting admin event: ${eventType}`);

    // Create the event details
    const eventDetails = {
      type: eventType,
      timestamp: new Date().toISOString(),
    };

    // Only try to dispatch DOM event if we're in a browser environment
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Create the event with details
      const event = new CustomEvent("adminAction", {
        detail: eventDetails,
        bubbles: true,
        cancelable: false,
      });

      // Dispatch the event
      document.dispatchEvent(event);
    }

    // Initialize window.adminUser if it doesn't exist, then add functions
    if (typeof window !== "undefined") {
      // Use type assertion to satisfy TypeScript
      const typedWindow = window as Window & { adminUser?: AdminUser };
      if (!typedWindow.adminUser) {
        typedWindow.adminUser = {
          emitAdminEvent,
          AdminEvents,
          clearAdminStatsCache: clearAdminStatsCache,
          clearUserCache: clearUserCache,
        };
      } else {
        typedWindow.adminUser.emitAdminEvent = emitAdminEvent;
        typedWindow.adminUser.AdminEvents = AdminEvents;
      }
    }

    return true;
  } catch (error) {
    console.error(`Error emitting admin event (${eventType}):`, error);
    return false;
  }
};

// Initialize window.adminUser if in browser environment
if (typeof window !== "undefined") {
  const adminUserObj = {
    emitAdminEvent,
    AdminEvents,
  };
  Object.defineProperty(window, "adminUser", {
    value: adminUserObj,
    writable: false,
    configurable: false,
  });
}

// Function to clear user cache
export const clearUserCache = (): void => {
  try {
    // Remove all user cache items
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);

    // Clear status-specific caches
    const statusTypes = [
      "active",
      "pending",
      "rejected",
      "suspended",
      "deleted",
    ];
    statusTypes.forEach((status) => {
      const key = `${USER_CACHE_BY_STATUS_PREFIX}${status}`;
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
    });

    //console.log("User cache cleared successfully");
  } catch (error) {
    console.error("Error clearing user cache:", error);
  }
};

// User interface
export interface User {
  id?: string;
  email: string;
  status: string;
  enabled: boolean;
  created: string;
  lastModified: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  role?: string;
  attributes?: Record<string, string>;
  customStatus?: string | null;
  profile?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    [key: string]: unknown;
  };
}

// Add type-safe enum for statuses
export type UserStatusType =
  | "pending"
  | "active"
  | "suspended"
  | "rejected"
  | "deleted";

// Define UserData interface for transformed user data (moved up to be defined before it's used)
export interface UserData {
  email: string;
  status: UserStatusType;
  role: "user" | "admin";
  created: string;
  lastLogin?: string;
  enabled: boolean;
  customStatus?: string | null;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

// Generate mock users for development when API fails
export const getMockUsers = (): User[] => {
  const now = new Date().toISOString();
  return [
    {
      email: "admin@example.com",
      status: "CONFIRMED",
      enabled: true,
      role: "admin",
      created: now,
      lastModified: now,
    },
    {
      email: "user1@example.com",
      status: "CONFIRMED",
      enabled: true,
      role: "user",
      created: now,
      lastModified: now,
    },
    {
      email: "pending@example.com",
      status: "FORCE_CHANGE_PASSWORD",
      enabled: true,
      role: "user",
      created: now,
      lastModified: now,
    },
    {
      email: "suspended@example.com",
      status: "CONFIRMED",
      enabled: false,
      role: "user",
      created: now,
      lastModified: now,
    },
  ];
};

// Helper to filter mock users by status
export const getFilteredMockUsers = (status: UserStatusType): User[] => {
  //console.log(`Filtering mock users by status: ${status}`);
  return getMockUsers().filter((user) => {
    switch (status) {
      case "pending":
        // Only count as pending if FORCE_CHANGE_PASSWORD and not rejected
        return (
          user.status === "FORCE_CHANGE_PASSWORD" &&
          user.customStatus !== "REJECTED"
        );
      case "active":
        return user.status === "CONFIRMED" && user.enabled;
      case "suspended":
        return !user.enabled && user.customStatus === "SUSPENDED";
      case "rejected":
        return user.customStatus === "REJECTED";
      case "deleted":
        return user.customStatus === "DELETED";
      default:
        return true;
    }
  });
};

// Helper function to safely parse the API response
const safelyParseApiResponse = <T>(data: unknown): T | null => {
  try {
    // If data is already a string, parse it
    if (typeof data === "string") {
      // Check if it's a JSON string in quotes (common with AppSync responses)
      if (data.startsWith('"') && data.endsWith('"')) {
        // Remove the surrounding quotes and parse
        data = JSON.parse(JSON.parse(data));
      } else {
        // Regular JSON string
        data = JSON.parse(data);
      }
    }
    return data as T;
  } catch (error) {
    console.warn("Error parsing API response:", error);
    //console.log("Raw response was:", data);
    return null;
  }
};

/**
 * Helper function to determine user status based on Cognito status and enabled state
 */
export const getUserStatus = (
  status: string,
  enabled: boolean,
  customStatus?: string | null,
): UserStatusType => {
  //console.log(
  //  `getUserStatus called with: status=${status}, enabled=${enabled}, customStatus=${customStatus}`,
  //);

  // First check for exact match on customStatus or status (to handle DynamoDB format)
  if (customStatus === "REJECTED" || status === "rejected") {
    //console.log("getUserStatus: returning 'rejected' (explicit match)");
    return "rejected";
  }

  if (customStatus === "SUSPENDED" || status === "suspended") {
    //console.log("getUserStatus: returning 'suspended' (explicit match)");
    return "suspended";
  }

  // If user is disabled but no custom status, treat as pending
  if (!enabled && !customStatus) {
    //console.log("getUserStatus: returning 'pending' (disabled user)");
    return "pending";
  }

  // Check for active status from customStatus
  if (customStatus === "ACTIVE") {
    //console.log("getUserStatus: returning 'active' (explicit custom status)");
    return "active";
  }

  // Map Cognito status to our UI status
  if (status === "CONFIRMED" && enabled) {
    //console.log("getUserStatus: returning 'active' (confirmed and enabled)");
    return "active";
  } else if (
    ["FORCE_CHANGE_PASSWORD", "UNCONFIRMED", "RESET_REQUIRED"].includes(status)
  ) {
    //console.log(
    //  "getUserStatus: returning 'pending' (password change/unconfirmed)",
    //);
    return "pending";
  }

  // Check for active status from DynamoDB
  if (status === "active") {
    //console.log("getUserStatus: returning 'active' (explicit DynamoDB match)");
    return "active";
  }

  // Check for pending status from DynamoDB
  if (status === "pending") {
    //console.log("getUserStatus: returning 'pending' (explicit DynamoDB match)");
    return "pending";
  }

  // Default to pending for any other status
  //console.log("getUserStatus: returning 'pending' (default fallback)");
  return "pending";
};

/**
 * Refresh user data cache by forcing a refetch
 */
export const refreshUserData = async (): Promise<void> => {
  //console.log("Refreshing user data cache...");

  // Clear all cached data
  clearUserCache();

  // Force a refresh by fetching all users
  await fetchUsers(true);

  // Wait a moment for consistency
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Fetch again to ensure we have the latest data
  await fetchUsers(true);
};

/**
 * Fetch all users from the Cognito user pool
 */
export const fetchUsers = async (
  forceRefresh: boolean = false,
): Promise<User[]> => {
  //console.log("Fetching users...");

  try {
    // Use the mockup data if configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log("Using mock data");
      return getMockUsers();
    }

    // Check cache first if not forcing a refresh
    if (!forceRefresh) {
      const cachedUsers = getCachedUsers();
      if (cachedUsers) {
        //console.log("Using cached user data");
        return cachedUsers;
      }
    }

    // If we get here, we need to fetch from the API
    //console.log("Fetching users from API...");

    // Use the same client pattern as other functions
    const client = getClientSchema();
    //console.log("Got client");

    const response = await client.queries.listUsers();
    //console.log("API response received:", response);

    // Parse the response using the existing helper
    if (response && response.data) {
      const parsedData = safelyParseApiResponse<User[]>(response.data);
      //console.log("Parsed response data:", parsedData);

      if (Array.isArray(parsedData)) {
        // Cache the fetched data
        cacheUsers(parsedData);
        return parsedData;
      } else {
        //console.warn("API returned data but not an array:", parsedData);
        return [];
      }
    }

    console.error("No data returned from listUsers query");
    return [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Fetch users filtered by status
export const fetchUsersByStatus = async (
  status: UserStatusType,
  forceRefresh: boolean = false,
): Promise<User[]> => {
  // Ensure status is lowercase for consistency
  const normalizedStatus = status.toLowerCase() as UserStatusType;

  try {
    //console.log(`Fetching users with status: ${normalizedStatus}`);

    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log("Using mock filtered data");
      return getFilteredMockUsers(normalizedStatus);
    }

    // Check cache first if not forcing a refresh
    if (!forceRefresh) {
      const cachedUsers = getCachedUsersByStatus(normalizedStatus);
      if (cachedUsers) {
        //console.log(`Using cached user data for status: ${normalizedStatus}`);
        return cachedUsers;
      }
    }

    // Get the authenticated client
    const client = getClientSchema();

    // Call the API with the normalized status parameter
    const response = await client.queries.getUsersByStatus({
      status: normalizedStatus,
    });
    //console.log("API response for getUsersByStatus:", response);

    // Process the data depending on its type
    if (response.data) {
      const parsedData = safelyParseApiResponse(response.data);
      //console.log("Parsed status filtered data:", parsedData);

      if (Array.isArray(parsedData)) {
        //console.log(
        //  `Raw data from getUsersByStatus(${normalizedStatus}):`,
        //  parsedData,
        //);

        let filteredData = parsedData.map((item) => {
          const mappedItem = {
            email: item.email,
            status: item.status,
            // Convert status to uppercase to match Cognito format for customStatus
            customStatus: item.status.toUpperCase(),
            role: item.role || "user",
            created: item.registrationDate, // Map to expected field name
            lastModified: item.lastStatusChange, // Map to expected field name
            enabled: item.status !== "suspended" && item.status !== "rejected", // Derive this
          };

          //console.log(`Mapped item for ${item.email}:`, mappedItem);
          return mappedItem;
        });

        //console.log(
        //  `After mapping, before filtering (${filteredData.length} items):`,
        //  filteredData,
        //);

        if (normalizedStatus === "pending") {
          filteredData = filteredData.filter((user) => {
            const shouldInclude =
              user.customStatus !== "REJECTED" &&
              user.status !== "rejected" &&
              user.customStatus !== "SUSPENDED" &&
              user.status !== "suspended";

            //console.log(
            //  `Filter pending: ${user.email} included? ${shouldInclude} (status=${user.status}, customStatus=${user.customStatus})`,
            //);
            return shouldInclude;
          });
        } else if (normalizedStatus === "rejected") {
          filteredData = filteredData.filter((user) => {
            const shouldInclude =
              user.customStatus === "REJECTED" || user.status === "rejected";

            //console.log(
            //  `Filter rejected: ${user.email} included? ${shouldInclude} (status=${user.status}, customStatus=${user.customStatus})`,
            //);
            return shouldInclude;
          });
        } else if (normalizedStatus === "suspended") {
          filteredData = filteredData.filter((user) => {
            const shouldInclude =
              user.customStatus === "SUSPENDED" || user.status === "suspended";

            //console.log(
            //  `Filter suspended: ${user.email} included? ${shouldInclude} (status=${user.status}, customStatus=${user.customStatus})`,
            //);
            return shouldInclude;
          });
        }

        //console.log(
        //  `Final filtered data for ${normalizedStatus} (${filteredData.length} items):`,
        //  filteredData,
        //);

        // Cache the filtered results
        cacheUsersByStatus(normalizedStatus, filteredData);

        return filteredData;
      } else {
        //console.warn("API returned data but not an array:", parsedData);
      }
    }

    // If we reach here, something went wrong
    //console.error(`Failed to get users with status ${normalizedStatus}`);
    return [];
  } catch (error) {
    console.error(
      `Error fetching users with status ${normalizedStatus}:`,
      error,
    );
    return [];
  }
};

// Get user details
export const getUserDetails = async (email: string): Promise<User> => {
  try {
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      const mockUser = getMockUsers().find((user) => user.email === email);
      if (mockUser) return mockUser;
    }

    const client = getClientSchema();
    //console.log(`Fetching user details for ${email}`);
    const response = await client.queries.getUserDetails({ email });

    //console.log(`User details response for ${email}:`, response);

    if (response.data) {
      const parsedData = safelyParseApiResponse(response.data);
      if (parsedData && typeof parsedData === "object") {
        return parsedData as User;
      }
    }

    throw new Error("Invalid user data received");
  } catch (error) {
    console.error(`Error fetching user details for ${email}:`, error);
    return {} as User; // Return empty user object
  }
};

// Keep fetchUserDetails for backwards compatibility
export const fetchUserDetails = getUserDetails;

// Approve user
export const approveUser = async (
  email: string,
  adminEmail?: string,
): Promise<boolean> => {
  try {
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log(
      //  `Mock approving user: ${email} by admin: ${adminEmail || "unknown"}`,
      //);
      return true;
    }

    const client = getClientSchema();
    const response = await client.mutations.approveUser({
      email,
      adminEmail: adminEmail || "admin@example.com",
    });
    //console.log(`Approve user API response for ${email}:`, response);

    // Parse response if needed
    if (response && response.data) {
      const result = safelyParseApiResponse(response.data);
      if (result) {
        clearUserCache();
        clearAdminStatsCache();
        emitAdminEvent(AdminEvents.USER_APPROVED);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error approving user ${email}:`, error);
    return false;
  }
};

// Reject user
export const rejectUser = async (
  email: string,
  reason?: string,
  adminEmail?: string,
): Promise<boolean> => {
  try {
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log(
      //  `Mock rejecting user: ${email} by admin: ${adminEmail || "unknown"}`,
      //);
      return true;
    }

    const client = getClientSchema();
    //console.log(`Rejecting user ${email} with reason: ${reason || "None"}`);

    const response = await client.mutations.rejectUser({
      email,
      reason,
      adminEmail: adminEmail || "admin@example.com",
    });

    //console.log("Reject user API response:", response);

    // Parse response if needed
    const result = safelyParseApiResponse(response.data);
    if (result) {
      clearUserCache();
      clearAdminStatsCache();
      emitAdminEvent(AdminEvents.USER_REJECTED);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error rejecting user ${email}:`, error);
    return false;
  }
};

// Suspend user
export const suspendUser = async (
  email: string,
  reason?: string,
  adminEmail?: string,
): Promise<boolean> => {
  try {
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log(
      //  `Mock suspending user: ${email} by admin: ${adminEmail || "unknown"}`,
      //);
      return true;
    }

    const client = getClientSchema();
    const response = await client.mutations.suspendUser({
      email,
      reason,
      adminEmail: adminEmail || "admin@example.com",
    });

    const result = safelyParseApiResponse(response.data);
    if (result) {
      clearUserCache();
      clearAdminStatsCache();
      emitAdminEvent(AdminEvents.USER_SUSPENDED);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error suspending user ${email}:`, error);
    return false;
  }
};

// Reactivate user
export const reactivateUser = async (
  email: string,
  adminEmail?: string,
): Promise<boolean> => {
  try {
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log(
      //  `Mock reactivating user: ${email} by admin: ${adminEmail || "unknown"}`,
      //);
      return true;
    }

    //console.log(
    //  `Reactivating user ${email} by admin ${adminEmail || "unknown"}`,
    //);

    // Clear caches before the operation to ensure fresh data is fetched after
    clearUserCache();
    clearAdminStatsCache();

    const client = getClientSchema();
    const response = await client.mutations.reactivateUser({
      email,
      adminEmail: adminEmail || "admin@example.com",
    });

    //console.log(`Reactivation response for ${email}:`, response);

    // Regardless of the result, wait a bit to ensure backend has processed the change
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = safelyParseApiResponse(response.data);
    if (result) {
      // Emit event after a brief delay to ensure client-side state is updated
      setTimeout(() => {
        emitAdminEvent(AdminEvents.USER_REACTIVATED);
      }, 100);

      // Force a manual refresh of the cache after operation
      await refreshUserData();

      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error reactivating user ${email}:`, error);
    return false;
  }
};

// Delete user
export const deleteUser = async (
  email: string,
  adminEmail?: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log(
      //  `Mock deleting user: ${email} by admin: ${adminEmail || "unknown"}`,
      //);
      return {
        success: true,
        message: `User ${email} has been deleted (mock).`,
      };
    }

    const client = getClientSchema();
    const response = await client.mutations.deleteUser({
      email,
      adminEmail: adminEmail || "admin@example.com", // Pass admin email to server
    });

    //console.log(`Delete user API response for ${email}:`, response);

    // Parse response
    if (response && response.data) {
      const result = safelyParseApiResponse(response.data);
      // Check if result has the expected structure
      if (result && typeof result === "object" && "success" in result) {
        const typedResult = result as { success: boolean; message: string };
        if (typedResult.success) {
          clearUserCache();
          clearAdminStatsCache();
          emitAdminEvent(AdminEvents.USER_DELETED);
        }
        return typedResult;
      }
    }

    return {
      success: false,
      message: "Failed to delete user - no response from server.",
    };
  } catch (error) {
    console.error(`Error deleting user ${email}:`, error);
    return {
      success: false,
      message: `Failed to delete user: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

// Add this interface for createTestUser
export interface CreateUserParams {
  email: string;
  password?: string;
  role: "user" | "admin";
  adminEmail?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  sendEmail?: boolean;
}

export interface CreateUserResult {
  success: boolean;
  message?: string;
  user?: {
    email: string;
    status: string;
    [key: string]: unknown;
  };
}

// Add the createTestUser function for test/development purposes only
export async function createTestUser(
  params: CreateUserParams,
): Promise<CreateUserResult> {
  try {
    const client = getClientSchema();
    //console.log("Creating user with params:", params);

    // Create mutation parameters including profile information
    const mutationParams = {
      email: params.email,
      role: params.role,
      adminEmail: params.adminEmail,
      // Only set sendEmail to false for test users, regular users should get emails
      sendEmail: params.sendEmail !== undefined ? params.sendEmail : false,
      firstName: params.firstName,
      lastName: params.lastName,
      companyName: params.companyName,
    };

    // Log the API call for debugging
    //console.log("Calling createUser mutation with:", mutationParams);

    const response = await client.mutations.createUser(mutationParams);

    //console.log("User creation API response:", response);

    if (response && response.data) {
      // Clear caches to ensure fresh data
      clearUserCache();
      clearAdminStatsCache();

      // Emit the event for listeners
      emitAdminEvent(AdminEvents.USER_CREATED);

      // Generate current timestamp for created/modified dates
      const now = new Date().toISOString();

      return {
        success: true,
        message: `User ${params.email} created successfully with auto-generated password. User will need password reset.`,
        user: {
          email: params.email,
          status: "FORCE_CHANGE_PASSWORD", // Add required status field
          role: params.role,
          firstName: params.firstName,
          lastName: params.lastName,
          companyName: params.companyName,
          created: now,
          lastModified: now,
          enabled: true,
        },
      };
    } else {
      return {
        success: false,
        message: response?.errors?.[0]?.message || "Failed to create test user",
      };
    }
  } catch (error) {
    console.error("Error creating test user:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// Add the createUser function that wraps createTestUser
export const createUser = async (
  email: string,
  role: string,
  sendEmail: boolean = true,
  skipEmailVerification: boolean = false,
  adminEmail?: string,
  firstName?: string,
  lastName?: string,
  companyName?: string,
): Promise<CreateUserResult> => {
  try {
    // If we're in mock mode for testing
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log(`Mock creating user: ${email} with role: ${role}`);
      const status = skipEmailVerification
        ? "CONFIRMED"
        : "FORCE_CHANGE_PASSWORD";
      return {
        success: true,
        user: {
          email,
          status,
          role,
          enabled: true,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          sendEmail,
          firstName,
          lastName,
          companyName,
        },
      };
    }

    //console.log(`Creating user with profile info:`, {
    //   email,
    //   role,
    //   firstName,
    //   lastName,
    //   companyName,
    //});

    // For real implementation, use createTestUser with parameters including profile info
    const result = await createTestUser({
      email,
      password: "", // Password will be auto-generated
      role: role as "user" | "admin",
      adminEmail,
      firstName,
      lastName,
      companyName,
      sendEmail,
    });

    // Return the result in the format expected by the test
    if (result.success) {
      const now = new Date().toISOString();
      return {
        success: true,
        user: {
          email,
          status: skipEmailVerification ? "CONFIRMED" : "FORCE_CHANGE_PASSWORD",
          sendEmail,
          role,
          enabled: true,
          created: now,
          lastModified: now,
          firstName,
          lastName,
          companyName,
        },
      };
    }

    return result;
  } catch (error) {
    console.error("Error in createUser:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
};

// Define an interface for activity items
export interface ActivityItem {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  resource: string;
  details: string;
}

// Define the AdminStats type
export interface AdminStats {
  users: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
    suspended: number;
  };
  assessments: {
    total: number;
    inProgress: number;
    completed: number;
    compliant: number;
    nonCompliant: number;
  };
  complianceRate: number;
  recentActivity: AuditLog[];
}

// Function to clear admin stats cache
export const clearAdminStatsCache = (): void => {
  try {
    //console.log("Clearing admin stats cache");
    localStorage.removeItem(ADMIN_STATS_CACHE_KEY);
    localStorage.removeItem(ADMIN_STATS_CACHE_TIMESTAMP_KEY);

    // Also clear user cache to ensure fresh data
    clearUserCache();

    //console.log("Admin stats and user cache cleared");
  } catch (error) {
    console.error("Error clearing admin stats cache:", error);
  }
};

// Fetch admin dashboard statistics
export const fetchAdminStats = async (
  forceRefresh: boolean = true,
): Promise<AdminStats> => {
  try {
    console.log("Fetching admin statistics, forceRefresh:", forceRefresh);

    // Always clear the cache when fetching admin stats to ensure fresh data
    clearAdminStatsCache();

    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log("Using mock statistics data");
      // Create mock stats
      return {
        users: {
          total: 10,
          active: 6,
          pending: 2,
          rejected: 1,
          suspended: 1,
        },
        assessments: {
          total: 15,
          inProgress: 5,
          completed: 10,
          compliant: 8,
          nonCompliant: 2,
        },
        complianceRate: 80,
        recentActivity: [],
      };
    }

    // Get the authenticated client
    const client = getClientSchema();

    // Add timestamp to ensure no caching at API level
    //const timestamp = Date.now();
    //console.log(`Requesting fresh admin stats at ${timestamp}`);

    // Call the API with valid parameters only
    const response = await client.queries.getAdminStats({
      // Use empty object with no cache-busting parameter to avoid linter errors
    });
    //console.log("API response for getAdminStats:", response);

    // For debugging, also try to fetch users directly to ensure data consistency
    try {
      //console.log("Fetching users as a secondary data source for verification");
      const usersResponse = await client.queries.listUsers({
        // Use empty object with no cache-busting parameter to avoid linter errors
      });

      if (usersResponse && usersResponse.data) {
        let usersList: User[] = [];

        // Parse the users data if needed
        if (typeof usersResponse.data === "string") {
          usersList = safelyParseApiResponse(usersResponse.data) as User[];
        } else if (Array.isArray(usersResponse.data)) {
          usersList = usersResponse.data;
        }

        if (usersList.length > 0) {
          //console.log(`Secondary data source: Found ${usersList.length} users`);

          // Count user statuses to compare with primary source
          const userCounts = {
            total: usersList.length,
            active: usersList.filter(
              (u) => u.status === "CONFIRMED" && u.enabled,
            ).length,
            pending: usersList.filter(
              (u) =>
                u.status === "FORCE_CHANGE_PASSWORD" &&
                u.customStatus !== "REJECTED" &&
                u.customStatus !== "SUSPENDED",
            ).length,
            rejected: usersList.filter((u) => u.customStatus === "REJECTED")
              .length,
            suspended: usersList.filter((u) => u.customStatus === "SUSPENDED")
              .length,
          };

          console.log("Secondary source user counts:", userCounts);
        }
      }
    } catch (usersFetchError) {
      console.error(
        "Error fetching users for verification (non-critical):",
        usersFetchError,
      );
    }

    // Process the data depending on its type
    if (response.data) {
      let parsedData: unknown;

      // Check if response.data is already an object or a string that needs parsing
      if (typeof response.data === "string") {
        parsedData = safelyParseApiResponse(response.data);
        //console.log("Parsed admin stats data:", parsedData);
      } else {
        // It's already an object
        parsedData = response.data;
        //console.log("Admin stats data (already an object):", parsedData);
      }

      // Check if the returned data is already in the expected format
      if (parsedData && typeof parsedData === "object") {
        // If it has all required properties, it's in the right format
        if (
          "users" in parsedData &&
          "assessments" in parsedData &&
          "complianceRate" in parsedData &&
          "recentActivity" in parsedData
        ) {
          const adminStats = parsedData as AdminStats;

          // If recent activity exists, ensure it's properly sorted
          if (Array.isArray(adminStats.recentActivity)) {
            // Clone the array to avoid mutating the original response
            adminStats.recentActivity = [...adminStats.recentActivity].sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
          }

          // Cache the stats data - but with a very short expiry to ensure fresh data on next fetch
          try {
            localStorage.setItem(
              ADMIN_STATS_CACHE_KEY,
              JSON.stringify(adminStats),
            );
            localStorage.setItem(
              ADMIN_STATS_CACHE_TIMESTAMP_KEY,
              Date.now().toString(),
            );
            //console.log("Admin stats cached with short expiry");
          } catch (error) {
            console.error("Error caching admin stats:", error);
          }

          // Debug log for audit logs from the API response
          // {
          //   interface ActivityItem {
          //     action: string;
          //     timestamp: string;
          //   }
          //   const statsData = parsedData as { recentActivity?: ActivityItem[] };
          //   console.log(
          //     "Full unfiltered API response for audit logs:",
          //     statsData.recentActivity
          //       ? statsData.recentActivity.map(
          //           (a) => `${a.action} - ${a.timestamp}`,
          //         )
          //       : "No recent activity",
          //   );
          // }

          return adminStats;
        }

        // If parsedData is an array of users, we need to format it as stats
        if (Array.isArray(parsedData)) {
          //console.log("Received an array of users, formatting as stats");
          const users = parsedData as User[];

          const stats: AdminStats = {
            users: {
              total: users.length,
              active: users.filter(
                (u: User) => u.status === "CONFIRMED" && u.enabled,
              ).length,
              pending: users.filter(
                (u: User) =>
                  u.status === "FORCE_CHANGE_PASSWORD" &&
                  u.customStatus !== "REJECTED" &&
                  u.customStatus !== "SUSPENDED",
              ).length,
              rejected: users.filter((u: User) => u.customStatus === "REJECTED")
                .length,
              suspended: users.filter(
                (u: User) => u.customStatus === "SUSPENDED",
              ).length,
            },
            assessments: {
              total: 0,
              inProgress: 0,
              completed: 0,
              compliant: 0,
              nonCompliant: 0,
            },
            complianceRate: 0,
            recentActivity: [],
          };

          return stats;
        }
      }
    }

    // If we reach here, something went wrong
    console.error("Failed to get admin statistics");
    return {
      users: { total: 0, active: 0, pending: 0, rejected: 0, suspended: 0 },
      assessments: {
        total: 0,
        inProgress: 0,
        completed: 0,
        compliant: 0,
        nonCompliant: 0,
      },
      complianceRate: 0,
      recentActivity: [],
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      users: { total: 0, active: 0, pending: 0, rejected: 0, suspended: 0 },
      assessments: {
        total: 0,
        inProgress: 0,
        completed: 0,
        compliant: 0,
        nonCompliant: 0,
      },
      complianceRate: 0,
      recentActivity: [],
    };
  }
};

// Define a type for audit log details
export type AuditLogDetails = Record<string, string | number | boolean | null>;

// Audit log interface
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  affectedResource: string;
  resourceId?: string;
  details?: AuditLogDetails;
}

// Fetch audit logs
export const fetchAuditLogs = async (
  dateRange?: { startDate?: string; endDate?: string },
  filters?: {
    action?: string;
    performedBy?: string;
    affectedResource?: string;
  },
): Promise<AuditLog[]> => {
  try {
    //console.log("Fetching audit logs with filters:", { dateRange, filters });

    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log("Using mock audit log data");
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      return [
        {
          id: "audit-1",
          timestamp: now.toISOString(),
          action: "USER_APPROVED",
          performedBy: "admin@example.com",
          affectedResource: "User",
          resourceId: "user1@example.com",
          details: { notes: "User approved after verification" },
        },
        {
          id: "audit-2",
          timestamp: yesterday.toISOString(),
          action: "USER_REJECTED",
          performedBy: "admin@example.com",
          affectedResource: "User",
          resourceId: "user2@example.com",
          details: { reason: "Invalid information provided" },
        },
        {
          id: "audit-3",
          timestamp: yesterday.toISOString(),
          action: "SYSTEM_SETTING_UPDATED",
          performedBy: "admin@example.com",
          affectedResource: "SystemSettings",
          details: { setting: "maxLoginAttempts", oldValue: 3, newValue: 5 },
        },
      ];
    }

    // Get the authenticated client
    const client = getClientSchema();
    const response = await client.queries.getAuditLogs({
      dateRange: dateRange || undefined,
      filters: filters || undefined,
    });
    //console.log("API response for getAuditLogs:", response);

    if (response.data) {
      const parsedData = safelyParseApiResponse(response.data);
      //console.log("Parsed audit logs data:", parsedData);
      if (Array.isArray(parsedData)) {
        return parsedData.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        }) as AuditLog[];
      }
    }

    console.error("Failed to get audit logs");
    return [];
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
};

// Define possible types for system setting values
export type SystemSettingValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>;

// System Setting interface
export interface SystemSetting {
  id: string;
  name: string;
  value: SystemSettingValue;
  description?: string;
  category?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

// Create an interface for the update system settings response
export interface UpdateSystemSettingsResponse {
  success: boolean;
  updatedCount?: number;
  updatedSettings?: SystemSetting[];
  error?: string;
}

// Update system settings
export const updateSystemSettings = async (
  settings: SystemSetting | SystemSetting[],
  updatedBy?: string,
): Promise<{
  success: boolean;
  updatedCount?: number;
  updatedSettings?: SystemSetting[];
  error?: string;
}> => {
  try {
    //console.log("Updating system settings:", settings);
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      //console.log("Simulating system settings update in mock mode");
      return {
        success: true,
        updatedCount: Array.isArray(settings) ? settings.length : 1,
        updatedSettings: Array.isArray(settings) ? settings : [settings],
      };
    }

    const client = getClientSchema();
    const response = await client.mutations.updateSystemSettingsConfig({
      settings,
      updatedBy: updatedBy || "",
    });
    //console.log("API response for updateSystemSettingsConfig:", response);

    if (response.data) {
      const parsedData = safelyParseApiResponse(response.data);
      //console.log("Parsed update settings response:", parsedData);
      if (
        parsedData &&
        typeof parsedData === "object" &&
        "success" in parsedData
      ) {
        return parsedData as UpdateSystemSettingsResponse;
      }
    }

    console.error("Failed to update system settings");
    return { success: false, error: "Failed to update system settings" };
  } catch (error) {
    console.error("Error updating system settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export interface SystemSettingsResponse {
  settings: SystemSetting[];
  settingsByCategory: Record<string, SystemSetting[]>;
}

// Fetch system settings
export const fetchSystemSettings =
  async (): Promise<SystemSettingsResponse> => {
    try {
      const client = getClientSchema();
      const response = await client.queries.getAllSystemSettings();
      //console.log("API response for getAllSystemSettings:", response);

      if (response.data) {
        const parsedData = safelyParseApiResponse(response.data);
        //console.log("Parsed system settings data:", parsedData);
        if (parsedData && typeof parsedData === "object") {
          return parsedData as SystemSettingsResponse;
        }
      }
      return { settings: [], settingsByCategory: {} };
    } catch (error) {
      console.error("Error fetching system settings:", error);
      return { settings: [], settingsByCategory: {} };
    }
  };

// Cache helpers
const getCachedUsers = (): User[] | null => {
  try {
    const cachedData = localStorage.getItem(USER_CACHE_KEY);
    const timestamp = localStorage.getItem(USER_CACHE_TIMESTAMP_KEY);
    if (!cachedData || !timestamp) return null;

    const cacheTime = parseInt(timestamp, 10);
    const now = Date.now();
    if (now - cacheTime > CACHE_DURATION_MS) {
      //console.log("Cache expired, needs refresh");
      return null;
    }

    const users = JSON.parse(cachedData) as User[];
    //console.log(`Retrieved ${users.length} users from cache`);
    return users;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
};

const getCachedUsersByStatus = (status: UserStatusType): User[] | null => {
  try {
    const key = `${USER_CACHE_BY_STATUS_PREFIX}${status}`;
    const cachedData = localStorage.getItem(key);
    const cacheTimestamp = localStorage.getItem(`${key}_timestamp`);
    if (!cachedData || !cacheTimestamp) return null;

    const timestamp = parseInt(cacheTimestamp, 10);
    const now = Date.now();
    if (now - timestamp > CACHE_DURATION_MS) {
      //console.log(`Cache for status ${status} has expired`);
      return null;
    }

    const parsedData = JSON.parse(cachedData);
    if (Array.isArray(parsedData)) {
      //console.log(
      //  `Retrieved ${parsedData.length} users from cache with status ${status}`,
      //);
      return parsedData;
    }
    return null;
  } catch (error) {
    console.error(`Error reading cache for status ${status}:`, error);
    return null;
  }
};

const cacheUsers = (users: User[]): void => {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(users));
    localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
    //console.log(`Cached ${users.length} users`);
  } catch (error) {
    console.error("Error writing to cache:", error);
  }
};

const cacheUsersByStatus = (status: UserStatusType, users: User[]): void => {
  try {
    const key = `${USER_CACHE_BY_STATUS_PREFIX}${status}`;
    localStorage.setItem(key, JSON.stringify(users));
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    //console.log(`Cached ${users.length} users with status ${status}`);
  } catch (error) {
    console.error(`Error caching users with status ${status}:`, error);
  }
};

// Define the transformUserData function (proper export)
export function transformUserData(fetchedUsers: User[]): UserData[] {
  if (!fetchedUsers || !Array.isArray(fetchedUsers)) {
    console.error("Invalid user data received:", fetchedUsers);
    return [];
  }

  //console.log("transformUserData called with:", fetchedUsers);

  // Helper function to determine user role
  const determineUserRole = (user: User): "user" | "admin" => {
    if (user.attributes?.["cognito:groups"]) {
      try {
        const groups = JSON.parse(user.attributes["cognito:groups"]);
        if (Array.isArray(groups) && groups.includes("GRC-Admin")) {
          return "admin";
        }
      } catch {
        console.warn("Failed to parse groups from user attributes");
      }
    }

    return (user.attributes?.["custom:role"] as "user" | "admin") || "user";
  };
  // Simplified helper function to extract user profile data
  const extractUserProfileData = (user: User) => {
    // Directly use the properties expected from the updated listUsers backend function
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const companyName = user.companyName || "";

    //console.log(`User ${user.email} extracted profile:`, {
    //  firstName,
    //  lastName,
    //  companyName,
    //});
    return { firstName, lastName, companyName };
  };

  // Transform the API data
  const transformedUsers = fetchedUsers
    .map((user) => {
      if (!user || !user.email) {
        //console.warn("Invalid user object in response:", user);
        return null;
      }

      // Log the raw user object received from fetchUsers before transformation
      //console.log(
      //  `[transformUserData] Raw user data for ${user.email}:`,
      //  JSON.stringify(user, null, 2),
      //);

      // Debug raw user status values before transformation
      //console.log(`User ${user.email} raw data:`, {
      //  status: user.status,
      //  enabled: user.enabled,
      //  customStatus: user.customStatus,
      //  attributes: user.attributes,
      //  firstName: user.firstName,
      //  lastName: user.lastName,
      //  companyName: user.companyName,
      //});

      const transformedStatus = getUserStatus(
        user.status || "",
        Boolean(user.enabled),
        user.customStatus || undefined,
      );

      // Extract user profile information
      const profileData = extractUserProfileData(user);

      return {
        email: user.attributes?.email || user.email,
        status: transformedStatus,
        role: determineUserRole(user),
        created: user.created,
        lastLogin: user.lastModified,
        enabled: user.enabled,
        customStatus: user.customStatus,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        companyName: profileData.companyName,
      };
    })
    .filter(Boolean) as UserData[]; // Remove any null entries

  //console.log("transformUserData result:", transformedUsers);
  return transformedUsers;
}
