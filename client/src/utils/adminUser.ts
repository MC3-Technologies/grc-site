// File: client/src/utils/adminUser.ts
import { getClientSchema } from "../amplify/schema";
//import { getAmplify } from "../amplify/amplify";
//import { useState, useEffect } from "react";

// Re-export getClientSchema so it can be imported from this module
export { getClientSchema };

// Define AdminUser interface to match the one in types.d.ts
interface AdminUser {
  emitAdminEvent: (type: string, data?: unknown) => boolean;
  AdminEvents: Record<string, string>;
  clearAdminStatsCache: () => void;
  clearUserCache: () => void;
}

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

    // ===== SPECIAL HANDLING FOR PENDING USERS =====
    // For pending users, we adopt a different strategy since there's a potential
    // mismatch between Cognito and DynamoDB due to user pool configuration issues
    if (normalizedStatus === "pending") {
      console.log("Fetching ALL users for pending status check");

      // First get all users from Cognito to ensure we have the most up-to-date list
      const allUsersResponse = await client.queries.listUsers();
      let allUsers: User[] = [];

      if (allUsersResponse && allUsersResponse.data) {
        const parsedAllUsers = safelyParseApiResponse<User[]>(
          allUsersResponse.data,
        );
        if (Array.isArray(parsedAllUsers)) {
          allUsers = parsedAllUsers;
          console.log(`Retrieved ${allUsers.length} total users from Cognito`);
        }
      }

      // Now fetch pending users from the UserStatus table
      const pendingUsersResponse = await client.queries.getUsersByStatus({
        status: normalizedStatus,
      });

      let pendingUsersFromDynamo: User[] = [];
      if (pendingUsersResponse && pendingUsersResponse.data) {
        const parsedData = safelyParseApiResponse(pendingUsersResponse.data);
        if (Array.isArray(parsedData)) {
          pendingUsersFromDynamo = parsedData.map((item) => ({
            email: item.email,
            status: item.status,
            customStatus: item.status.toUpperCase(),
            role: item.role || "user",
            created: item.registrationDate || new Date().toISOString(),
            lastModified: item.lastStatusChange || new Date().toISOString(),
            enabled: item.status !== "suspended" && item.status !== "rejected",
            firstName: item.firstName,
            lastName: item.lastName,
            companyName: item.companyName,
          }));

          console.log(
            `Retrieved ${pendingUsersFromDynamo.length} pending users from DynamoDB`,
          );
        }
      }

      // Create a set of emails already in the DynamoDB table
      const pendingEmailsInDynamoDB = new Set(
        pendingUsersFromDynamo.map((user) => user.email),
      );

      // Find Cognito users that should be considered pending (disabled users not in other statuses)
      const pendingUsersFromCognito = allUsers
        .filter((user) => {
          // Only include users not already in DynamoDB and are disabled (pending)
          return (
            !pendingEmailsInDynamoDB.has(user.email) &&
            !user.enabled &&
            user.status !== "rejected" &&
            user.customStatus !== "REJECTED" &&
            user.status !== "suspended" &&
            user.customStatus !== "SUSPENDED"
          );
        })
        .map((user) => ({
          email: user.email,
          status: "pending" as UserStatusType,
          customStatus: "PENDING",
          role: user.role || "user",
          created: user.created || new Date().toISOString(),
          lastModified: user.lastModified || new Date().toISOString(),
          enabled: false,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
        }));

      console.log(
        `Found ${pendingUsersFromCognito.length} additional pending users from Cognito`,
      );

      // Combine both sources of pending users
      const combinedPendingUsers = [
        ...pendingUsersFromDynamo,
        ...pendingUsersFromCognito,
      ];
      console.log(
        `Combined total: ${combinedPendingUsers.length} pending users`,
      );

      // Cache the combined results
      cacheUsersByStatus(normalizedStatus, combinedPendingUsers);

      return combinedPendingUsers;
    }

    // Normal handling for non-pending status types
    const response = await client.queries.getUsersByStatus({
      status: normalizedStatus,
    });

    // Process the data depending on its type
    if (response.data) {
      const parsedData = safelyParseApiResponse(response.data);

      if (Array.isArray(parsedData)) {
        const filteredData = parsedData.map((item) => {
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

          return mappedItem;
        });

        // Further filtering based on status
        let resultData = filteredData;

        if (normalizedStatus === "rejected") {
          resultData = filteredData.filter(
            (user) =>
              user.customStatus === "REJECTED" || user.status === "rejected",
          );
        } else if (normalizedStatus === "suspended") {
          resultData = filteredData.filter(
            (user) =>
              user.customStatus === "SUSPENDED" || user.status === "suspended",
          );
        }

        // Cache the filtered results
        cacheUsersByStatus(normalizedStatus, resultData);
        return resultData;
      }
    }

    // If we reach here, something went wrong
    console.error(`Failed to get users with status ${normalizedStatus}`);
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
      return true;
    }

    // Clear caches before operation to ensure fresh data
    clearUserCache();
    clearAdminStatsCache();

    console.log(
      `Rejecting user ${email} with reason: ${reason || "None provided"}`,
    );
    const client = getClientSchema();

    const response = await client.mutations.rejectUser({
      email,
      reason,
      adminEmail: adminEmail || "admin@example.com",
    });

    // Wait for backend processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Parse response if needed
    const result = safelyParseApiResponse(response.data);
    if (result) {
      console.log(`Successfully rejected user: ${email}`);

      // Emit event immediately
      emitAdminEvent(AdminEvents.USER_REJECTED);

      // Force a refresh of data after rejection
      setTimeout(async () => {
        // Explicitly fetch the updated user counts to ensure the dashboard shows correct data
        const updatedCounts = await getAllUserCounts();
        console.log("Updated user counts after rejection:", updatedCounts);

        // Force a refresh of all user data
        await refreshUserData();

        // Double-check that we have the latest stats for the dashboard with a slight delay
        setTimeout(async () => {
          await fetchAdminStats();

          // Trigger a special event for dashboard refresh
          document.dispatchEvent(
            new CustomEvent("adminAction", {
              detail: { type: "FORCE_DASHBOARD_SYNC" },
              bubbles: true,
            }),
          );
        }, 500);
      }, 1000);

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
      return true;
    }

    // Clear caches before the operation to ensure fresh data is fetched after
    clearUserCache();
    clearAdminStatsCache();

    console.log(`Suspending user ${email} by admin ${adminEmail || "unknown"}`);

    const client = getClientSchema();
    const response = await client.mutations.suspendUser({
      email,
      reason,
      adminEmail: adminEmail || "admin@example.com",
    });

    // Regardless of the result, wait a bit to ensure backend has processed the change
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = safelyParseApiResponse(response.data);
    if (result) {
      console.log(`Successfully suspended user: ${email}`);

      // Emit event to notify listeners
      emitAdminEvent(AdminEvents.USER_SUSPENDED);

      // Force a refresh of data after suspension
      setTimeout(async () => {
        // Explicitly fetch the updated user counts to ensure the dashboard shows correct data
        const updatedCounts = await getAllUserCounts();
        console.log("Updated user counts after suspension:", updatedCounts);

        // Force a refresh of all user data
        await refreshUserData();

        // Double-check that we have the latest stats for the dashboard with a slight delay
        setTimeout(async () => {
          await fetchAdminStats();

          // Trigger a special event for dashboard refresh
          document.dispatchEvent(
            new CustomEvent("adminAction", {
              detail: { type: "FORCE_DASHBOARD_SYNC" },
              bubbles: true,
            }),
          );
        }, 500);
      }, 1000);

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
      return true;
    }

    // Clear caches before the operation to ensure fresh data is fetched after
    clearUserCache();
    clearAdminStatsCache();

    console.log(
      `Reactivating user ${email} by admin ${adminEmail || "unknown"}`,
    );

    const client = getClientSchema();
    const response = await client.mutations.reactivateUser({
      email,
      adminEmail: adminEmail || "admin@example.com",
    });

    // Regardless of the result, wait a bit to ensure backend has processed the change
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = safelyParseApiResponse(response.data);
    if (result) {
      console.log(`Successfully reactivated user: ${email}`);

      // Emit event to notify listeners
      emitAdminEvent(AdminEvents.USER_REACTIVATED);

      // Force a refresh of data after reactivation
      setTimeout(async () => {
        // Explicitly fetch the updated user counts to ensure the dashboard shows correct data
        const updatedCounts = await getAllUserCounts();
        console.log("Updated user counts after reactivation:", updatedCounts);

        // Force a refresh of all user data
        await refreshUserData();

        // Double-check that we have the latest stats for the dashboard with a slight delay
        setTimeout(async () => {
          await fetchAdminStats();

          // Trigger a special event for dashboard refresh
          document.dispatchEvent(
            new CustomEvent("adminAction", {
              detail: { type: "FORCE_DASHBOARD_SYNC" },
              bubbles: true,
            }),
          );
        }, 500);
      }, 1000);

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

// Add a new function to directly query all users by status from DynamoDB
export const getAllUserCounts = async (): Promise<{
  total: number;
  active: number;
  pending: number;
  rejected: number;
  suspended: number;
}> => {
  try {
    console.log("Getting all user counts directly for dashboard");

    // Initialize counts object
    const counts = {
      total: 0,
      active: 0,
      pending: 0,
      rejected: 0,
      suspended: 0,
    };

    const client = getClientSchema();

    // First, get ALL users to ensure total count is accurate
    try {
      const allUsersResponse = await client.queries.getAllUsers();
      if (allUsersResponse?.data) {
        const allUsers = safelyParseApiResponse(allUsersResponse.data);
        if (Array.isArray(allUsers)) {
          counts.total = allUsers.length;
          console.log(`GetAllUserCounts: Found ${counts.total} total users`);
        }
      }
    } catch (error) {
      console.error("Error counting all users:", error);
      counts.total = 0; // Reset to recalculate below
    }

    // Query each status separately for maximum reliability
    // Using Promise.allSettled to fetch counts concurrently and handle individual errors
    const statusPromises = [
      client.queries.getUsersByStatus({ status: "active" }),
      client.queries.getUsersByStatus({ status: "pending" }),
      client.queries.getUsersByStatus({ status: "rejected" }), // <-- Added rejected query
      client.queries.getUsersByStatus({ status: "suspended" }),
    ];

    const results = await Promise.allSettled(statusPromises);

    // Process Active Users
    if (results[0].status === "fulfilled" && results[0].value.data) {
      const activeUsers = safelyParseApiResponse(results[0].value.data);
      if (Array.isArray(activeUsers)) {
        counts.active = activeUsers.length;
        console.log(`GetAllUserCounts: Found ${counts.active} active users`);
      }
    } else if (results[0].status === "rejected") {
      console.error("Error counting active users:", results[0].reason);
    }

    // Process Pending Users
    if (results[1].status === "fulfilled" && results[1].value.data) {
      const pendingUsers = safelyParseApiResponse(results[1].value.data);
      if (Array.isArray(pendingUsers)) {
        counts.pending = pendingUsers.length;
        console.log(`GetAllUserCounts: Found ${counts.pending} pending users`);
      }
    } else if (results[1].status === "rejected") {
      console.error("Error counting pending users:", results[1].reason);
    }

    // Process Rejected Users
    if (results[2].status === "fulfilled" && results[2].value.data) {
      const rejectedUsers = safelyParseApiResponse(results[2].value.data);
      if (Array.isArray(rejectedUsers)) {
        counts.rejected = rejectedUsers.length;
        console.log(
          `GetAllUserCounts: Found ${counts.rejected} rejected users`,
        );
      }
    } else if (results[2].status === "rejected") {
      console.error("Error counting rejected users:", results[2].reason);
    }

    // Process Suspended Users
    if (results[3].status === "fulfilled" && results[3].value.data) {
      const suspendedUsers = safelyParseApiResponse(results[3].value.data);
      if (Array.isArray(suspendedUsers)) {
        counts.suspended = suspendedUsers.length;
        console.log(
          `GetAllUserCounts: Found ${counts.suspended} suspended users`,
        );
      }
    } else if (results[3].status === "rejected") {
      console.error("Error counting suspended users:", results[3].reason);
    }

    // If we failed to get total directly, calculate it as sum of all status counts
    if (counts.total === 0) {
      counts.total =
        counts.active + counts.pending + counts.rejected + counts.suspended;
      console.log(
        `GetAllUserCounts: Total users calculated from statuses: ${counts.total}`,
      );
    }

    return counts;
  } catch (error) {
    console.error("Error getting all user counts:", error);
    return {
      total: 0,
      active: 0,
      pending: 0,
      rejected: 0,
      suspended: 0,
    };
  }
};

// Add a new function to directly query all assessment counts
export const getAllAssessmentCounts = async (): Promise<{
  total: number;
  inProgress: number;
  completed: number;
  compliant: number;
  nonCompliant: number;
}> => {
  try {
    console.log("Getting all assessment counts directly for dashboard");

    // Initialize counts object
    const counts = {
      total: 0,
      inProgress: 0,
      completed: 0,
      compliant: 0,
      nonCompliant: 0,
    };

    // Import assessment utility classes
    const { InProgressAssessment, CompletedAssessment } = await import(
      "./assessment"
    );

    // Fetch assessments from both tables concurrently for efficiency
    const [inProgressAssessments, completedAssessments] = await Promise.all([
      InProgressAssessment.fetchAllAssessments(),
      CompletedAssessment.fetchAllCompletedAssessments(),
    ]);

    // Count in-progress assessments
    counts.inProgress = inProgressAssessments.length;
    console.log(
      `GetAllAssessmentCounts: Found ${counts.inProgress} in-progress assessments`,
    );

    // Count completed assessments
    counts.completed = completedAssessments.length;
    console.log(
      `GetAllAssessmentCounts: Found ${counts.completed} completed assessments`,
    );

    // Count compliant and non-compliant assessments
    counts.compliant = completedAssessments.filter(
      (a) => a.isCompliant === true,
    ).length;
    counts.nonCompliant = completedAssessments.filter(
      (a) => a.isCompliant === false,
    ).length;

    // Calculate total assessments
    counts.total = counts.inProgress + counts.completed;
    console.log(`GetAllAssessmentCounts: Total assessments: ${counts.total}`);

    return counts;
  } catch (error) {
    console.error("Error getting assessment counts:", error);
    return {
      total: 0,
      inProgress: 0,
      completed: 0,
      compliant: 0,
      nonCompliant: 0,
    };
  }
};

// Modify fetchAdminStats to use the new function
export const fetchAdminStats = async (): Promise<AdminStats> => {
  try {
    console.log("Fetching admin statistics with direct count queries");

    // Always clear the cache when fetching admin stats to ensure fresh data
    clearAdminStatsCache();

    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
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

    // IMPORTANT: Always get fresh counts directly - this is critical for accurate dashboard display
    const dbUserStats = await getAllUserCounts();
    console.log("Direct user stats for dashboard:", dbUserStats);

    // NEW: Get direct assessment counts
    const dbAssessmentStats = await getAllAssessmentCounts();
    console.log("Direct assessment stats for dashboard:", dbAssessmentStats);

    // Now call the regular getAdminStats query for other data
    const response = await client.queries.getAdminStats({});

    // Process the data depending on its type
    if (response.data) {
      let parsedData: unknown;
      if (typeof response.data === "string") {
        parsedData = safelyParseApiResponse(response.data);
      } else {
        parsedData = response.data;
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

          // IMPORTANT: Always override with our direct counts
          adminStats.users = dbUserStats;
          adminStats.assessments = dbAssessmentStats;

          // Recalculate compliance rate based on direct counts
          adminStats.complianceRate =
            adminStats.assessments.completed > 0
              ? Math.round(
                  (adminStats.assessments.compliant /
                    adminStats.assessments.completed) *
                    100,
                )
              : 0;

          // If recent activity exists, ensure it's properly sorted
          if (Array.isArray(adminStats.recentActivity)) {
            // Clone the array to avoid mutating the original response
            adminStats.recentActivity = [...adminStats.recentActivity].sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
          }

          // Cache the stats data
          try {
            localStorage.setItem(
              ADMIN_STATS_CACHE_KEY,
              JSON.stringify(adminStats),
            );
            localStorage.setItem(
              ADMIN_STATS_CACHE_TIMESTAMP_KEY,
              Date.now().toString(),
            );
          } catch (error) {
            console.error("Error caching admin stats:", error);
          }

          return adminStats;
        }

        // If parsedData is an array of users, we need to format it as stats
        if (Array.isArray(parsedData)) {
          const stats: AdminStats = {
            users: dbUserStats, // Use the directly queried user stats
            assessments: dbAssessmentStats, // NEW: Use directly queried assessment stats
            complianceRate:
              dbAssessmentStats.completed > 0
                ? Math.round(
                    (dbAssessmentStats.compliant /
                      dbAssessmentStats.completed) *
                      100,
                  )
                : 0,
            recentActivity: [],
          };

          return stats;
        }
      }
    }

    // If we reach here, something went wrong - return stats with just the direct count data
    console.error(
      "Failed to get admin statistics, returning direct stats only",
    );
    return {
      users: dbUserStats,
      assessments: dbAssessmentStats,
      complianceRate:
        dbAssessmentStats.completed > 0
          ? Math.round(
              (dbAssessmentStats.compliant / dbAssessmentStats.completed) * 100,
            )
          : 0,
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
    // If user has a role property directly from DynamoDB, prioritize it
    if (user.role === "admin") {
      // This is the role from DynamoDB, it takes precedence
      console.log(`User ${user.email} has role 'admin' from DynamoDB`);
      return "admin";
    } else if (user.role === "user") {
      console.log(`User ${user.email} has role 'user' from DynamoDB`);
      return "user";
    }

    // If no role in DynamoDB, check Cognito groups as fallback
    if (user.attributes?.["cognito:groups"]) {
      try {
        const groups = JSON.parse(user.attributes["cognito:groups"]);
        if (Array.isArray(groups) && groups.includes("GRC-Admin")) {
          console.log(`User ${user.email} has admin role from Cognito groups`);
          return "admin";
        }
      } catch {
        console.warn("Failed to parse groups from user attributes");
      }
    }

    // Check for custom role attribute as last fallback
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
      console.log(
        `[transformUserData] Raw user data for ${user.email}:`,
        JSON.stringify(
          {
            email: user.email,
            status: user.status,
            enabled: user.enabled,
            role: user.role, // This should come from DynamoDB
            customStatus: user.customStatus,
          },
          null,
          2,
        ),
      );

      const transformedStatus = getUserStatus(
        user.status || "",
        Boolean(user.enabled),
        user.customStatus || undefined,
      );

      // Extract user profile information
      const profileData = extractUserProfileData(user);

      // Get the role (prioritizing DynamoDB over Cognito)
      const userRole = determineUserRole(user);

      return {
        email: user.attributes?.email || user.email,
        status: transformedStatus,
        role: userRole,
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

// Add a new function to fetch all users via API
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    console.log("Fetching all users from DynamoDB");

    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== "production") {
      return getMockUsers();
    }

    const client = getClientSchema();
    const response = await client.queries.getAllUsers();

    if (response.data) {
      const parsedData = safelyParseApiResponse(response.data);
      if (Array.isArray(parsedData)) {
        console.log(`Received ${parsedData.length} users from API`);
        return parsedData;
      }
    }

    console.error("Failed to get all users from API");
    return [];
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};
