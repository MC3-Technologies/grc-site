// File: client/src/utils/adminUser.ts
import { getClientSchema } from "../amplify/schema";
//import { useState, useEffect } from "react";

// Export the getClientSchema for use in components
export { getClientSchema };

// Set this to false to use real data from the API
const USE_MOCK_DATA = false;

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
  role?: string;
  attributes?: Record<string, string>;
  customStatus?: string | null;
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
      lastModified: now
    },
    {
      email: "user1@example.com",
      status: "CONFIRMED",
      enabled: true,
      role: "user",
      created: now,
      lastModified: now
    },
    {
      email: "pending@example.com",
      status: "FORCE_CHANGE_PASSWORD",
      enabled: true,
      role: "user",
      created: now,
      lastModified: now
    },
    {
      email: "suspended@example.com",
      status: "CONFIRMED",
      enabled: false,
      role: "user",
      created: now,
      lastModified: now
    }
  ];
};

// Helper to filter mock users by status
export const getFilteredMockUsers = (status: string): User[] => {
  console.log(`Filtering mock users by status: ${status}`);
  return getMockUsers().filter(user => {
    switch (status) {
      case "pending":
        // Only count as pending if FORCE_CHANGE_PASSWORD and not rejected
        return user.status === "FORCE_CHANGE_PASSWORD" && 
               user.customStatus !== "REJECTED";
      case "active":
        return user.status === "CONFIRMED" && user.enabled;
      case "suspended":
        return !user.enabled && user.customStatus === "SUSPENDED";
      case "rejected":
        return user.customStatus === "REJECTED";
      default:
        return true;
    }
  });
};

// Helper function to safely parse the API response
const safelyParseApiResponse = <T>(data: unknown): T | null => {
  try {
    // If data is already a string, parse it
    if (typeof data === 'string') {
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
    console.warn('Error parsing API response:', error);
    console.log('Raw response was:', data);
    return null;
  }
};

/**
 * Helper function to determine user status based on Cognito status and enabled state
 */
export const getUserStatus = (
  status: string,
  enabled: boolean,
  customStatus?: string | null
): "active" | "pending" | "rejected" | "suspended" => {
  // First check custom status which overrides default
  if (customStatus === "REJECTED") {
    return "rejected";
  }
  
  if (customStatus === "SUSPENDED") {
    return "suspended";
  }
  
  // If user is disabled but not rejected or suspended, treat as rejected
  if (!enabled && !customStatus) {
    return "rejected";
  }

  // Map Cognito status to our UI status
  if (status === "CONFIRMED" && enabled) {
    return "active";
  } else if (
    ["FORCE_CHANGE_PASSWORD", "UNCONFIRMED", "RESET_REQUIRED"].includes(status)
  ) {
    return "pending";
  }
  
  // Default to pending for any other status
  return "pending";
};

/**
 * Refresh user data cache by forcing a refetch
 */
export const refreshUserData = async (): Promise<void> => {
  console.log("Refreshing user data cache...");
  
  // Clear any cached data and force a refresh by fetching all users
  await fetchUsers();
  
  // Wait a moment for consistency
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Fetch again to ensure we have the latest data
  await fetchUsers();
};

/**
 * Fetch all users from the Cognito user pool
 */
export const fetchUsers = async (): Promise<User[]> => {
  console.log("Fetching users...");
  
  try {
    // Use the mockup data if configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== 'production') {
      console.log("Using mock data");
      return getMockUsers();
    }
    
    // Use the same client pattern as other functions
    const client = getClientSchema();
    console.log("Got client");
    
    const response = await client.queries.listUsers();
    console.log("API response received:", response);
    
    // Parse the response using the existing helper
    if (response && response.data) {
      const parsedData = safelyParseApiResponse<User[]>(response.data);
      console.log("Parsed response data:", parsedData);
      
      if (Array.isArray(parsedData)) {
        return parsedData;
      } else {
        console.warn('API returned data but not an array:', parsedData);
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
  status: "pending" | "active" | "rejected" | "suspended"
): Promise<User[]> => {
  try {
    console.log(`Fetching users with status: ${status}`);
    
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== 'production') {
      console.log("Using mock filtered data");
      return getFilteredMockUsers(status);
    }
    
    // Get the authenticated client
    const client = getClientSchema();
    
    // Call the API with the status parameter
    const response = await client.queries.getUsersByStatus({ status });
    console.log("API response for getUsersByStatus:", response);
    
    // Process the data depending on its type
    if (response.data) {
      const parsedData = safelyParseApiResponse(response.data);
      console.log('Parsed status filtered data:', parsedData);
      
      if (Array.isArray(parsedData)) {
        // Apply specific filters as needed
        if (status === "pending") {
          return (parsedData as User[]).filter(user => 
            user.customStatus !== "REJECTED" && 
            user.status !== "rejected"
          );
        } else if (status === "rejected") {
          // Return users with REJECTED customStatus or rejected status
          return (parsedData as User[]).filter(user => 
            user.customStatus === "REJECTED" || 
            user.status === "rejected"
          );
        } else if (status === "suspended") {
          // Return users with SUSPENDED customStatus or suspended status
          return (parsedData as User[]).filter(user => 
            user.customStatus === "SUSPENDED" || 
            user.status === "suspended"
          );
        }
        return parsedData as User[];
      } else {
        console.warn('API returned data but not an array:', parsedData);
      }
    }
    
    // If we reach here, something went wrong
    console.error(`Failed to get users with status ${status}`);
    return [];
  } catch (error) {
    console.error(`Error fetching users with status ${status}:`, error);
    return [];
  }
};

// Get user details
export const getUserDetails = async (email: string): Promise<User> => {
  try {
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== 'production') {
      const mockUser = getMockUsers().find(user => user.email === email);
      if (mockUser) return mockUser;
    }
    
    const client = getClientSchema();
    const response = await client.queries.getUserDetails({ email });
    
    if (response.data) {
      const parsedData = safelyParseApiResponse(response.data);
      if (parsedData && typeof parsedData === 'object') {
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
export const approveUser = async (email: string): Promise<boolean> => {
  try {
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== 'production') {
      console.log(`Mock approving user: ${email}`);
      return true;
    }
    
    const client = getClientSchema();
    const response = await client.mutations.approveUser({ email });
    console.log(`Approve user API response for ${email}:`, response);
    
    // Parse response if needed
    if (response && response.data) {
      const result = safelyParseApiResponse(response.data);
      return Boolean(result);
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
): Promise<boolean> => {
  try {
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== 'production') {
      console.log(`Mock rejecting user: ${email}`);
      return true;
    }
    
    const client = getClientSchema();
    const response = await client.mutations.rejectUser({ email, reason });
    
    // Parse response if needed
    const result = safelyParseApiResponse(response.data);
    return Boolean(result);
  } catch (error) {
    console.error(`Error rejecting user ${email}:`, error);
    return false;
  }
};

// Suspend user
export const suspendUser = async (
  email: string,
  reason?: string,
): Promise<boolean> => {
  try {
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== 'production') {
      console.log(`Mock suspending user: ${email}`);
      return true;
    }
    
    const client = getClientSchema();
    const response = await client.mutations.suspendUser({ email, reason });
    
    // Parse response if needed
    const result = safelyParseApiResponse(response.data);
    return Boolean(result);
  } catch (error) {
    console.error(`Error suspending user ${email}:`, error);
    return false;
  }
};

// Reactivate user
export const reactivateUser = async (email: string): Promise<boolean> => {
  try {
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== 'production') {
      console.log(`Mock reactivating user: ${email}`);
      return true;
    }
    
    const client = getClientSchema();
    const response = await client.mutations.reactivateUser({ email });
    
    // Parse response if needed
    const result = safelyParseApiResponse(response.data);
    return Boolean(result);
  } catch (error) {
    console.error(`Error reactivating user ${email}:`, error);
    return false;
  }
};

// Result type for user creation
export interface CreateUserResult {
  success: boolean;
  user?: {
    email: string;
    status: string;
    [key: string]: unknown;
  };
  error?: string;
}

// Create user
export const createUser = async (
  email: string,
  role: string,
  sendEmail = true,
): Promise<CreateUserResult> => {
  try {
    // Only use mock data if explicitly configured
    if (USE_MOCK_DATA && process.env.NODE_ENV !== 'production') {
      console.log(`Mock creating user: ${email}`);
      return {
        success: true,
        user: {
          email,
          status: 'FORCE_CHANGE_PASSWORD',
          role
        }
      };
    }
    
    const client = getClientSchema();
    console.log(`Creating user: ${email}, role: ${role}, sendEmail: ${sendEmail}`);
    
    const response = await client.mutations.createUser({
      email,
      role,
      sendEmail,
    });
    
    console.log('Create user API response:', response);
    
    // Parse the response
    if (response && response.data) {
      const parsedData = safelyParseApiResponse(response.data);
      console.log('Parsed create user response:', parsedData);
      
      if (parsedData && typeof parsedData === 'object') {
        return parsedData as CreateUserResult;
      } else if (parsedData === true) {
        // Simple boolean success response
        return {
          success: true,
          user: { email, role, status: 'FORCE_CHANGE_PASSWORD' }
        };
      }
    }
    
    throw new Error("Invalid response from user creation API");
  } catch (error: unknown) {
    console.error(`Error creating user ${email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Create a test user to verify functionality
export const createTestUser = async (): Promise<CreateUserResult> => {
  try {
    const testEmail = `test-user-${Math.floor(Math.random() * 10000)}@example.com`;
    console.log(`Creating test user: ${testEmail}`);
    const result = await createUser(testEmail, "user", false);
    console.log("Test user creation result:", result);
    return result;
  } catch (error) {
    console.error("Error creating test user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};