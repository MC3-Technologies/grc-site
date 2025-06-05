import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import { User, UserStatusType } from "./adminUser";

// Generate the Amplify Data client
const client = generateClient<Schema>();

// Convert Amplify Data API UserStatus to our User interface
const userStatusToUser = (userStatus: Record<string, unknown>): User => {
  return {
    id: userStatus.email,
    email: userStatus.email,
    firstName: userStatus.firstName || "",
    lastName: userStatus.lastName || "",
    role: userStatus.role || "user",
    status: userStatus.status || "pending",
    enabled:
      userStatus.status !== "suspended" && userStatus.status !== "rejected",
    created: userStatus.registrationDate || new Date().toISOString(),
    lastModified: userStatus.lastStatusChange || new Date().toISOString(),
    attributes: {
      email: userStatus.email,
      firstName: userStatus.firstName || "",
      lastName: userStatus.lastName || "",
      companyName: userStatus.companyName || "",
      role: userStatus.role || "user",
    },
  };
};

// List all users using Amplify Data API
export const listAllUsers = async (): Promise<User[]> => {
  try {
    console.log("Listing all users via Amplify Data API");

    // In development mode, return mock data
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "DEVELOPMENT MODE: Using mock users instead of Amplify API call",
      );
      const { getMockUsers } = await import("./adminUser");
      return getMockUsers();
    }

    const response = await client.queries.getAllUsers();

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      throw new Error(`Failed to fetch users: ${response.errors[0].message}`);
    }

    if (!response.data) {
      return [];
    }

    // Parse the JSON response
    const usersData = JSON.parse(response.data as string);

    if (usersData.error) {
      throw new Error(usersData.error);
    }

    // Convert to User interface
    return usersData.map((userData: Record<string, unknown>) =>
      userStatusToUser(userData),
    );
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
};

// Get users by status using Amplify Data API
export const getUsersByStatus = async (status: string): Promise<User[]> => {
  try {
    console.log(`Fetching users with status: ${status}`);

    // In development mode, return mock data
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "DEVELOPMENT MODE: Using filtered mock users instead of Amplify API call",
      );
      const { getFilteredMockUsers } = await import("./adminUser");
      return getFilteredMockUsers(status as UserStatusType);
    }

    const response = await client.queries.getUsersByStatus({
      status: status,
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      throw new Error(
        `Failed to fetch users by status: ${response.errors[0].message}`,
      );
    }

    if (!response.data) {
      return [];
    }

    // Parse the JSON response
    const usersData = JSON.parse(response.data as string);

    if (usersData.error) {
      throw new Error(usersData.error);
    }

    // Convert to User interface
    return usersData.map((userData: Record<string, unknown>) =>
      userStatusToUser(userData),
    );
  } catch (error) {
    console.error(`Error fetching users with status ${status}:`, error);
    throw error;
  }
};

// Get user details by email using Amplify Data API
export const getUserDetails = async (email: string): Promise<User> => {
  try {
    console.log(`Fetching user details for: ${email}`);

    // In development mode, return mock data
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "DEVELOPMENT MODE: Using mock user instead of Amplify API call",
      );
      const { getMockUsers } = await import("./adminUser");
      const mockUsers = getMockUsers();
      const user = mockUsers.find((u) => u.email === email);
      if (user) return user;
      throw new Error(`User ${email} not found in mock data`);
    }

    const response = await client.queries.getUserDetails({
      email: email,
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      throw new Error(
        `Failed to fetch user details: ${response.errors[0].message}`,
      );
    }

    if (!response.data) {
      throw new Error(`User ${email} not found`);
    }

    // Parse the JSON response
    const userData = JSON.parse(response.data as string);

    if (userData.error) {
      throw new Error(userData.error);
    }

    // Convert to User interface
    return userStatusToUser(userData);
  } catch (error) {
    console.error(`Error fetching user details for ${email}:`, error);
    throw error;
  }
};

// Approve user using Amplify Data API
export const approveUser = async (email: string): Promise<boolean> => {
  try {
    console.log(`Approving user: ${email}`);

    // In development mode, simulate success
    if (process.env.NODE_ENV !== "production") {
      console.log("DEVELOPMENT MODE: Simulating user approval");
      return true;
    }

    const response = await client.mutations.approveUser({
      email: email,
      adminEmail: "admin", // You might want to get this from current user context
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      throw new Error(`Failed to approve user: ${response.errors[0].message}`);
    }

    return response.data === true;
  } catch (error) {
    console.error(`Error approving user ${email}:`, error);
    throw error;
  }
};

// Reject user using Amplify Data API
export const rejectUser = async (
  email: string,
  reason?: string,
): Promise<boolean> => {
  try {
    console.log(`Rejecting user: ${email}`);

    // In development mode, simulate success
    if (process.env.NODE_ENV !== "production") {
      console.log("DEVELOPMENT MODE: Simulating user rejection");
      return true;
    }

    const response = await client.mutations.rejectUser({
      email: email,
      reason: reason,
      adminEmail: "admin", // You might want to get this from current user context
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      throw new Error(`Failed to reject user: ${response.errors[0].message}`);
    }

    return response.data === true;
  } catch (error) {
    console.error(`Error rejecting user ${email}:`, error);
    throw error;
  }
};

// Suspend user using Amplify Data API
export const suspendUser = async (
  email: string,
  reason?: string,
): Promise<boolean> => {
  try {
    console.log(`Suspending user: ${email}`);

    // In development mode, simulate success
    if (process.env.NODE_ENV !== "production") {
      console.log("DEVELOPMENT MODE: Simulating user suspension");
      return true;
    }

    const response = await client.mutations.suspendUser({
      email: email,
      reason: reason,
      adminEmail: "admin", // You might want to get this from current user context
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      throw new Error(`Failed to suspend user: ${response.errors[0].message}`);
    }

    return response.data === true;
  } catch (error) {
    console.error(`Error suspending user ${email}:`, error);
    throw error;
  }
};

// Reactivate user using Amplify Data API
export const reactivateUser = async (email: string): Promise<boolean> => {
  try {
    console.log(`Reactivating user: ${email}`);

    // In development mode, simulate success
    if (process.env.NODE_ENV !== "production") {
      console.log("DEVELOPMENT MODE: Simulating user reactivation");
      return true;
    }

    const response = await client.mutations.reactivateUser({
      email: email,
      adminEmail: "admin", // You might want to get this from current user context
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      throw new Error(
        `Failed to reactivate user: ${response.errors[0].message}`,
      );
    }

    return response.data === true;
  } catch (error) {
    console.error(`Error reactivating user ${email}:`, error);
    throw error;
  }
};

// Create user interface for the result
export interface CreateUserResult {
  success: boolean;
  user?: {
    email: string;
    status: string;
    [key: string]: unknown;
  };
  error?: string;
}

// Create user using Amplify Data API
export const createUser = async (
  email: string,
  role: string,
  sendEmail = true,
  firstName?: string,
  lastName?: string,
  companyName?: string,
): Promise<CreateUserResult> => {
  try {
    console.log(`Creating user: ${email}`);

    // In development mode, simulate success
    if (process.env.NODE_ENV !== "production") {
      console.log("DEVELOPMENT MODE: Simulating user creation");
      return {
        success: true,
        user: {
          email: email,
          status: "pending",
          role: role,
        },
      };
    }

    const response = await client.mutations.createUser({
      email: email,
      role: role,
      sendEmail: sendEmail,
      adminEmail: "admin", // You might want to get this from current user context
      firstName: firstName,
      lastName: lastName,
      companyName: companyName,
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      return {
        success: false,
        error: `Failed to create user: ${response.errors[0].message}`,
      };
    }

    if (!response.data) {
      return {
        success: false,
        error: "No response data received",
      };
    }

    // Parse the JSON response
    const result = JSON.parse(response.data as string);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Unknown error occurred",
      };
    }

    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    console.error(`Error creating user ${email}:`, error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

// Update user role using Amplify Data API
export const updateUserRole = async (
  email: string,
  role: string,
): Promise<boolean> => {
  try {
    console.log(`Updating user role: ${email} to ${role}`);

    // In development mode, simulate success
    if (process.env.NODE_ENV !== "production") {
      console.log("DEVELOPMENT MODE: Simulating user role update");
      return true;
    }

    const response = await client.mutations.updateUserRole({
      email: email,
      role: role,
      adminEmail: "admin", // You might want to get this from current user context
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      throw new Error(
        `Failed to update user role: ${response.errors[0].message}`,
      );
    }

    return response.data === true;
  } catch (error) {
    console.error(`Error updating user role for ${email}:`, error);
    throw error;
  }
};

// Delete user using Amplify Data API
export const deleteUser = async (email: string): Promise<boolean> => {
  try {
    console.log(`Deleting user: ${email}`);

    // In development mode, simulate success
    if (process.env.NODE_ENV !== "production") {
      console.log("DEVELOPMENT MODE: Simulating user deletion");
      return true;
    }

    const response = await client.mutations.deleteUser({
      email: email,
      adminEmail: "admin", // You might want to get this from current user context
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Amplify API errors:", response.errors);
      throw new Error(`Failed to delete user: ${response.errors[0].message}`);
    }

    if (!response.data) {
      return false;
    }

    // Parse the JSON response
    const result = JSON.parse(response.data as string);

    return result.success === true;
  } catch (error) {
    console.error(`Error deleting user ${email}:`, error);
    throw error;
  }
};
