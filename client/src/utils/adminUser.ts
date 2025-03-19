// File: client/src/utils/adminUser.ts
import { getClientSchema } from "../amplify/schema";

// User interface
export interface User {
  email: string;
  status: string;
  enabled: boolean;
  created: string;
  lastModified: string;
  attributes?: Record<string, string>;
}

// List all users
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const client = getClientSchema();
    const response = await client.queries.listUsers();
    return JSON.parse(response.data as string) as User[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return []; // Return empty array instead of throwing
  }
};

// Get users by status
export const fetchUsersByStatus = async (status: string): Promise<User[]> => {
  try {
    const client = getClientSchema();
    const response = await client.queries.getUsersByStatus({ status });
    return JSON.parse(response.data as string) as User[];
  } catch (error) {
    console.error(`Error fetching users with status ${status}:`, error);
    return []; // Return empty array instead of throwing
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
export const rejectUser = async (email: string, reason?: string): Promise<boolean> => {
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
export const suspendUser = async (email: string, reason?: string): Promise<boolean> => {
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
  sendEmail = true
): Promise<CreateUserResult> => {
  try {
    const client = getClientSchema();
    const response = await client.mutations.createUser({ email, role, sendEmail });
    return JSON.parse(response.data as string) as CreateUserResult;
  } catch (error: unknown) {
    console.error(`Error creating user ${email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};