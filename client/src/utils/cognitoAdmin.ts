import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  //AdminSetUserPasswordCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminAddUserToGroupCommand,
  //AdminRemoveUserFromGroupCommand,
  ListUsersCommand,
  AttributeType,
  AdminConfirmSignUpCommand,
  //AdminInitiateAuthCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";

// Import existing User type
import { User, UserStatusType } from "./adminUser";
import { getCognitoConfig } from "./cognitoConfig";

// Cognito client setup
let cognitoClient: CognitoIdentityProviderClient | null = null;
let userPoolId: string | null = null;

// Initialize the Cognito client
export const initCognitoClient = () => {
  if (!cognitoClient) {
    const config = getCognitoConfig();
    userPoolId = config.userPoolId;

    cognitoClient = new CognitoIdentityProviderClient({
      region: config.region,
      // In a real application, you would use proper credentials
      // For development, you might use credentials from Amplify configuration
    });
  }

  return { client: cognitoClient, userPoolId };
};

// Convert Cognito attributes to User object
const attributesToUser = (
  attributes: AttributeType[] = [],
  username: string,
): User => {
  // Create a map of attribute names to values
  const attrMap: Record<string, string> = {};
  attributes.forEach((attr) => {
    if (attr.Name && attr.Value) {
      attrMap[attr.Name] = attr.Value;
    }
  });

  // Map Cognito attributes to our User interface
  return {
    id: username,
    email: attrMap["email"] || username,
    firstName: attrMap["given_name"],
    lastName: attrMap["family_name"],
    role: attrMap["custom:role"] || "user",
    status: attrMap["status"] || "pending",
    enabled: true,
    created: attrMap["created"] || new Date().toISOString(),
    lastModified: attrMap["lastModified"] || new Date().toISOString(),
    attributes: attrMap,
  };
};

// List all users
export const listAllUsers = async (): Promise<User[]> => {
  try {
    //console.log("Listing all users via Cognito SDK");

    // In development mode, return mock data
    if (process.env.NODE_ENV !== "production") {
      //console.log(
      //  "DEVELOPMENT MODE: Using mock users instead of Cognito API call",
      //);
      const { getMockUsers } = await import("./adminUser");
      return getMockUsers();
    }

    const { client, userPoolId } = initCognitoClient();

    const command = new ListUsersCommand({
      UserPoolId: userPoolId!,
      Limit: 60, // adjust as needed
    });

    const response = await client.send(command);
    //console.log("Cognito response:", response);

    if (!response.Users) {
      return [];
    }

    // Map Cognito user data to our User interface
    return response.Users.map((user) =>
      attributesToUser(user.Attributes, user.Username || ""),
    );
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
};

// Get users by status
export const getUsersByStatus = async (status: string): Promise<User[]> => {
  try {
    //console.log(`Fetching users with status: ${status}`);

    // In development mode, return mock data
    if (process.env.NODE_ENV !== "production") {
      //console.log(
      //  "DEVELOPMENT MODE: Using filtered mock users instead of Cognito API call",
      //);
      const { getFilteredMockUsers } = await import("./adminUser");
      return getFilteredMockUsers(status as UserStatusType);
    }

    const { client, userPoolId } = initCognitoClient();

    // For Cognito users, we need to filter after retrieval
    // We'll use a filter string if possible
    let filterString;

    switch (status) {
      case "pending":
        filterString = 'cognito:user_status = "FORCE_CHANGE_PASSWORD"';
        break;
      case "suspended":
        // We'll get all users and filter by enabled status after
        break;
      case "approved":
      case "active":
        filterString = 'cognito:user_status = "CONFIRMED"';
        break;
      default:
        // No filter, get all users
        break;
    }

    const command = new ListUsersCommand({
      UserPoolId: userPoolId!,
      Filter: filterString,
      Limit: 60,
    });

    const response = await client.send(command);

    if (!response.Users) {
      return [];
    }

    let users = response.Users.map((user) => {
      // Create a user object
      const userObj = attributesToUser(user.Attributes, user.Username || "");

      // Set enabled status
      userObj.enabled = user.Enabled ?? false;

      // Set status based on Cognito status and enabled flag
      if (status === "suspended" && !user.Enabled) {
        userObj.status = "suspended";
      } else if (user.UserStatus === "FORCE_CHANGE_PASSWORD") {
        userObj.status = "pending";
      } else if (user.UserStatus === "CONFIRMED" && user.Enabled) {
        userObj.status = "approved";
      }

      return userObj;
    });

    // If we're filtering by suspended status, we need to filter here
    if (status === "suspended") {
      users = users.filter((user) => !user.enabled);
    }

    return users;
  } catch (error) {
    console.error(`Error fetching users with status ${status}:`, error);
    throw error;
  }
};

// Get user details by email
export const getUserDetails = async (email: string): Promise<User> => {
  try {
    //console.log(`Fetching user details for: ${email}`);

    // In development mode, return mock data
    if (process.env.NODE_ENV !== "production") {
      //console.log(
      //  "DEVELOPMENT MODE: Using mock user instead of Cognito API call",
      //);
      const { getMockUsers } = await import("./adminUser");
      const mockUsers = getMockUsers();
      const user = mockUsers.find((u) => u.email === email);
      if (user) return user;
      throw new Error(`User not found: ${email}`);
    }

    const { client, userPoolId } = initCognitoClient();

    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId!,
      Username: email,
    });

    const response = await client.send(command);

    return attributesToUser(response.UserAttributes, email);
  } catch (error) {
    console.error(`Error fetching user details for ${email}:`, error);
    return {} as User; // Return empty user object instead of throwing
  }
};

// Approve user
export const approveUser = async (email: string): Promise<boolean> => {
  try {
    //console.log(`Approving user: ${email}`);

    // In development mode, return success
    if (process.env.NODE_ENV !== "production") {
      //console.log("DEVELOPMENT MODE: Simulating user approval");
      return true;
    }

    const { client, userPoolId } = initCognitoClient();

    // 1. Confirm the user's signup if not already confirmed
    const confirmCommand = new AdminConfirmSignUpCommand({
      UserPoolId: userPoolId!,
      Username: email,
    });

    await client.send(confirmCommand);

    // 2. Enable the user
    const enableCommand = new AdminEnableUserCommand({
      UserPoolId: userPoolId!,
      Username: email,
    });

    await client.send(enableCommand);

    // 3. Update user attributes to mark as approved
    const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId!,
      Username: email,
      UserAttributes: [
        {
          Name: "custom:status",
          Value: "approved",
        },
      ],
    });

    await client.send(updateAttributesCommand);

    return true;
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
    //console.log(`Rejecting user: ${email}`);

    // In development mode, return success
    if (process.env.NODE_ENV !== "production") {
      //console.log("DEVELOPMENT MODE: Simulating user rejection");
      return true;
    }

    const { client, userPoolId } = initCognitoClient();

    // Update user attributes to mark as rejected
    const attributes: AttributeType[] = [
      {
        Name: "custom:status",
        Value: "rejected",
      },
    ];

    if (reason) {
      attributes.push({
        Name: "custom:rejectionReason",
        Value: reason,
      });
    }

    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId!,
      Username: email,
      UserAttributes: attributes,
    });

    await client.send(command);

    return true;
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
    //console.log(`Suspending user: ${email}`);

    // In development mode, return success
    if (process.env.NODE_ENV !== "production") {
      //console.log("DEVELOPMENT MODE: Simulating user suspension");
      return true;
    }

    const { client, userPoolId } = initCognitoClient();

    // 1. Disable the user
    const disableCommand = new AdminDisableUserCommand({
      UserPoolId: userPoolId!,
      Username: email,
    });

    await client.send(disableCommand);

    // 2. Update user attributes to store suspension reason if provided
    if (reason) {
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId!,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:suspensionReason",
            Value: reason,
          },
          {
            Name: "custom:status",
            Value: "suspended",
          },
        ],
      });

      await client.send(updateAttributesCommand);
    }

    return true;
  } catch (error) {
    console.error(`Error suspending user ${email}:`, error);
    return false;
  }
};

// Reactivate user
export const reactivateUser = async (email: string): Promise<boolean> => {
  try {
    //console.log(`Reactivating user: ${email}`);

    // In development mode, return success
    if (process.env.NODE_ENV !== "production") {
      //console.log("DEVELOPMENT MODE: Simulating user reactivation");
      return true;
    }

    const { client, userPoolId } = initCognitoClient();

    // 1. Enable the user
    const enableCommand = new AdminEnableUserCommand({
      UserPoolId: userPoolId!,
      Username: email,
    });

    await client.send(enableCommand);

    // 2. Update user attributes to remove suspension reason and mark as active
    const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId!,
      Username: email,
      UserAttributes: [
        {
          Name: "custom:status",
          Value: "approved",
        },
      ],
    });

    await client.send(updateAttributesCommand);

    return true;
  } catch (error) {
    console.error(`Error reactivating user ${email}:`, error);
    return false;
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
    //console.log(`Creating user: ${email} with role: ${role}`);

    // In development mode, return success
    if (process.env.NODE_ENV !== "production") {
      //console.log("DEVELOPMENT MODE: Simulating user creation");
      return {
        success: true,
        user: {
          email,
          status: "pending",
          role,
        },
      };
    }

    const { client, userPoolId } = initCognitoClient();

    // Create the user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId!,
      Username: email,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
        {
          Name: "custom:role",
          Value: role,
        },
      ],
      MessageAction: sendEmail
        ? ("SEND" as MessageActionType)
        : ("SUPPRESS" as MessageActionType),
    });

    const createResponse = await client.send(createCommand);

    if (!createResponse.User) {
      throw new Error("Failed to create user");
    }

    // If role is specified, add user to appropriate group
    if (role) {
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId!,
        Username: email,
        GroupName: role.toUpperCase(),
      });

      await client.send(addToGroupCommand);
    }

    return {
      success: true,
      user: {
        email,
        status: "pending",
        role,
      },
    };
  } catch (error) {
    console.error(`Error creating user ${email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Export for backwards compatibility
export const fetchUserDetails = getUserDetails;

// Add a helper function to get mock data for testing
export const __getMocks = async () => {
  const adminUserModule = await import("./adminUser");
  return { adminUser: adminUserModule };
};

// Helper function for development mode testing - expose publicly for tests
export const _getUserDetailsDevelopment = async (
  email: string,
): Promise<User> => {
  // In development mode, fetch from mock data
  try {
    const adminUserModule = await import("./adminUser");
    // Get mock users
    const mockUsers = adminUserModule.getMockUsers();
    // Find user by email
    const user = mockUsers.find((u: { email: string }) => u.email === email);
    if (!user) {
      throw new Error("User not found in mock data");
    }
    return user;
  } catch (err) {
    console.error("Error in development getUserDetails:", err);
    return {} as User;
  }
};
