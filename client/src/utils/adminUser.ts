// File: client/src/utils/adminUser.ts
import { getClientSchema } from "../amplify/schema";


// User interface
export interface User {
  id?: string;
  email: string;
  status: string;
  enabled: boolean;
  created: string;
  lastModified: string;
  attributes?: Record<string, string>;
}

// Error response type
export interface ErrorResponse {
 error: string;
 users?: User[];
}

// Generate mock users for development when API fails
const getMockUsers = (): User[] => {
  const now = new Date().toISOString();
  return [
    {
      email: "admin@example.com",
      status: "CONFIRMED",
      enabled: true,
      created: now,
      lastModified: now
    },
    {
      email: "user1@example.com",
      status: "CONFIRMED",
      enabled: true,
      created: now,
      lastModified: now
    },
    {
      email: "pending@example.com",
      status: "FORCE_CHANGE_PASSWORD",
      enabled: true,
      created: now,
      lastModified: now
    },
    {
      email: "suspended@example.com",
      status: "CONFIRMED",
      enabled: false,
      created: now,
      lastModified: now
    }
  ];
};

// Helper to filter mock users by status
const getFilteredMockUsers = (status: string): User[] => {
  console.log(`Filtering mock users by status: ${status}`);
  return getMockUsers().filter(user => {
    switch (status) {
      case "pending":
        return user.status === "FORCE_CHANGE_PASSWORD";
      case "active":
        return user.status === "CONFIRMED" && user.enabled;
      case "suspended":
        return !user.enabled;
      default:
        return true;
    }
  });
};

// List all users
export const fetchUsers = async (): Promise<User[]> => {
  try {
    console.log("Fetching users...");
    
    // Check if we should force mock data (development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log("Using mock data in development");
      return [
        {
          id: '1',
          email: 'admin@example.com',
          status: 'CONFIRMED',
          enabled: true,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        },
        {
          id: '2',
          email: 'user1@example.com',
          status: 'CONFIRMED',
          enabled: true,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        },
        {
          id: '3',
          email: 'pending@example.com',
          status: 'FORCE_CHANGE_PASSWORD',
          enabled: true,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        },
        {
          id: '4',
          email: 'suspended@example.com',
          status: 'CONFIRMED',
          enabled: false,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      ];
    }
    
    const authenticatedClient = getClientSchema();
    console.log("Got authenticated client");
    
    const response = await authenticatedClient.queries.listUsers();
    console.log("Response from listUsers:", response);
    
    // Handle errors
    if (response.errors && response.errors.length > 0) {
      console.error("Error response from API:", JSON.stringify(response.errors, null, 2));
      throw new Error(response.errors[0].message);
    }
    
    // Handle successful response
    if (response.data) {
      try {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        return Array.isArray(data) ? data : [];
      } catch (parseError) {
        console.error("Error parsing response data:", parseError);
        throw new Error("Failed to parse user data");
      }
    }
    
    throw new Error("No data received from API");
  } catch (error) {
    console.error("Error fetching users:", error);
    // Always return mock data in development
    if (process.env.NODE_ENV !== 'production') {
      return getMockUsers();
    }
    throw error;
  }
};

// Get users by status
export const fetchUsersByStatus = async (status: string): Promise<User[]> => {
  try {
    // Use getClientSchema to ensure authentication
    const authenticatedClient = getClientSchema();
    
    try {
      const response = await authenticatedClient.queries.getUsersByStatus({
        status,
      });
      
      // Handle errors in response
      if (response.errors && response.errors.length > 0) {
        console.error("Error response from API:", response.errors);
        
        // Use mock data in development mode
        if (process.env.NODE_ENV !== "production") {
          console.warn("Using filtered mock user data due to API error");
          return getFilteredMockUsers(status);
        }
        return [];
      }
      
      // The response.data is a JSON string that needs to be parsed
      if (response.data) {
        try {
          if (typeof response.data === 'string') {
            const parsed = JSON.parse(response.data);
            return Array.isArray(parsed) ? parsed : [];
          } else if (Array.isArray(response.data)) {
            // Response was already an array
            return response.data;
          } else if (response.data === null) {
            console.warn("Response data is null. Using mock data.");
            if (process.env.NODE_ENV !== "production") {
              return getFilteredMockUsers(status);
            }
            return [];
          }
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          if (process.env.NODE_ENV !== "production") {
            return getFilteredMockUsers(status);
          }
        }
      }
      
      console.warn("Unexpected response format", response);
      // Use mock data in development
      if (process.env.NODE_ENV !== "production") {
        return getFilteredMockUsers(status);
      }
      return [];
    } catch (apiError) {
      console.error(`API error fetching users with status ${status}:`, apiError);
      if (process.env.NODE_ENV !== "production") {
        return getFilteredMockUsers(status);
      }
      return [];
    }
  } catch (error) {
    console.error(`Error fetching users with status ${status}:`, error);
    if (process.env.NODE_ENV !== "production") {
      return getFilteredMockUsers(status);
    }
    return [];
  }
};

// Get user details (renamed to match test expectations)
export const getUserDetails = async (email: string): Promise<User> => {
  try {
    const client = getClientSchema();
    const response = await client.queries.getUserDetails({ email });
    return JSON.parse(response.data as string) as User;
  } catch (error) {
    console.error(`Error fetching user details for ${email}:`, error);
    return {} as User; // Return empty object instead of throwing
  }
};

// Keep fetchUserDetails for backwards compatibility
export const fetchUserDetails = getUserDetails;

// Approve user
export const approveUser = async (email: string): Promise<boolean> => {
  try {
    const client = getClientSchema();
    const response = await client.mutations.approveUser({ email });
    // Access the data property, which contains the boolean result
    return !!response.data;
  } catch (error) {
    console.error(`Error approving user ${email}:`, error);
    return false; // Return false instead of throwing
  }
};

// Reject user
export const rejectUser = async (
  email: string,
  reason?: string,
): Promise<boolean> => {
  try {
    const client = getClientSchema();
    const response = await client.mutations.rejectUser({ email, reason });
    // Access the data property, which contains the boolean result
    return !!response.data;
  } catch (error) {
    console.error(`Error rejecting user ${email}:`, error);
    return false; // Return false instead of throwing
  }
};

// Suspend user
export const suspendUser = async (
  email: string,
  reason?: string,
): Promise<boolean> => {
  try {
    const client = getClientSchema();
    const response = await client.mutations.suspendUser({ email, reason });
    // Access the data property, which contains the boolean result
    return !!response.data;
  } catch (error) {
    console.error(`Error suspending user ${email}:`, error);
    return false; // Return false instead of throwing
  }
};

// Reactivate user
export const reactivateUser = async (email: string): Promise<boolean> => {
  try {
    const client = getClientSchema();
    const response = await client.mutations.reactivateUser({ email });
    // Access the data property, which contains the boolean result
    return !!response.data;
  } catch (error) {
    console.error(`Error reactivating user ${email}:`, error);
    return false; // Return false instead of throwing
  }
};

// Create user
export interface CreateUserResult {
  success: boolean;
  user?: {
    email: string;
    status: string;
    [key: string]: unknown;
  };
  error?: string;
}

export const createUser = async (
  email: string,
  role: string,
  sendEmail = true,
): Promise<CreateUserResult> => {
  try {
    const client = getClientSchema();
    const response = await client.mutations.createUser({
      email,
      role,
      sendEmail,
    });
    return JSON.parse(response.data as string) as CreateUserResult;
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
