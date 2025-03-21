// File: amplify/functions/user-management/src/userOperations.ts
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  MessageActionType,
  UserType,
  AttributeType,
  AdminUpdateUserAttributesCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { env } from "$amplify/env/user-management";
// Import email templates
import { 
  approvalTemplate, 
  rejectionTemplate, 
  suspensionTemplate, 
  reactivationTemplate 
} from "./templates/emailTemplates";

// Create clients with more robust error handling
const getCognitoClient = () => {
  try {
    return new CognitoIdentityProviderClient();
  } catch (error) {
    console.error("Error creating Cognito client:", error);
    throw error;
  }
};

const getSesClient = () => {
  try {
    return new SESClient();
  } catch (error) {
    console.error("Error creating SES client:", error);
    throw error;
  }
};

// Initialize clients
let cognito: CognitoIdentityProviderClient;
let ses: SESClient;

try {
  cognito = getCognitoClient();
  ses = getSesClient();
  console.log("AWS clients initialized successfully");
} catch (error) {
  console.error("Error initializing AWS clients:", error);
}

// Define email interface
interface EmailOptions {
  to: string;
  subject: string;
  message: string;
}

// Helper to send email notifications
const sendEmail = async ({
  to,
  subject,
  message,
}: EmailOptions): Promise<boolean> => {
  try {
    if (!ses) {
      console.error("SES client not initialized");
      return false;
    }

    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: message,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: env.EMAIL_SENDER || "cmmc.support@mc3technologies.com",
    });

    await ses.send(command);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Define types for user data
interface UserData {
  email: string | undefined;
  status: string | undefined;
  enabled: boolean | undefined;
  created: Date | undefined;
  lastModified: Date | undefined;
  attributes?: Record<string, string>;
}

// Safely get environment variables
const getUserPoolId = (): string | null => {
  try {
    // First, check all the available env vars for debugging
    console.log("Available environment variables with AUTH/POOL/COGNITO:", 
      Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('pool') || 
        key.toLowerCase().includes('cognito') || 
        key.toLowerCase().includes('auth')
      )
    );
    
    // AMPLIFY_AUTH_USERPOOL_ID is the primary source for Amplify Gen 2
    if (process.env.AMPLIFY_AUTH_USERPOOL_ID) {
      console.log("Using AMPLIFY_AUTH_USERPOOL_ID:", process.env.AMPLIFY_AUTH_USERPOOL_ID);
      return process.env.AMPLIFY_AUTH_USERPOOL_ID;
    }
    
    // Log warning if AMPLIFY_AUTH_USERPOOL_ID is missing
    console.warn("AMPLIFY_AUTH_USERPOOL_ID is missing, checking fallbacks");
    
    // Check if the environment object from Amplify has the value (different mechanism)
    try {
      if (env && (env as any).AMPLIFY_AUTH_USERPOOL_ID) {
        console.log("Found in env.AMPLIFY_AUTH_USERPOOL_ID:", (env as any).AMPLIFY_AUTH_USERPOOL_ID);
        return (env as any).AMPLIFY_AUTH_USERPOOL_ID;
      }
    } catch (envError) {
      console.error("Error accessing env object:", envError);
    }
    
    // Try other common environment variable names as last resort
    const possibleEnvVars = [
      'AUTH_USERPOOL_ID',
      'USER_POOL_ID',
      'COGNITO_USER_POOL_ID'
    ];
    
    for (const varName of possibleEnvVars) {
      if (process.env[varName] && !process.env[varName].includes('will_be_replaced')) {
        console.log(`Using ${varName}:`, process.env[varName]);
        return process.env[varName];
      }
    }
    
    // Last resort - parse the AMPLIFY_SSM_ENV_CONFIG if available
    if (process.env.AMPLIFY_SSM_ENV_CONFIG) {
      try {
        const ssmConfig = JSON.parse(process.env.AMPLIFY_SSM_ENV_CONFIG);
        console.log("SSM Config:", ssmConfig);
        
        // Look for user pool ID in SSM config
        for (const key in ssmConfig) {
          if (ssmConfig[key] && ssmConfig[key].name && 
              ssmConfig[key].name.includes('USERPOOL_ID')) {
            const userPoolId = process.env[ssmConfig[key].name];
            if (userPoolId) {
              console.log(`Found user pool ID in ${ssmConfig[key].name}:`, userPoolId);
              return userPoolId;
            }
          }
        }
      } catch (ssmError) {
        console.error("Error parsing SSM config:", ssmError);
      }
    }
    
    console.error("No valid User Pool ID found in any environment variable");
    return null;
  } catch (error) {
    console.error("Error accessing environment variables:", error);
    return null;
  }
};

// Helper function to generate a secure password that meets Cognito requirements
const generateSecurePassword = (): string => {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+{}:"<>?|[];\',./`~';
  
  // Ensure at least one of each required character type
  let password = 
    uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length)) +
    lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length)) +
    numbers.charAt(Math.floor(Math.random() * numbers.length)) +
    specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Add additional random characters to reach min length of 8
  const allChars = uppercaseChars + lowercaseChars + numbers + specialChars;
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// User Operations
export const userOperations = {
  // List all users
  listUsers: async (): Promise<string> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId) {
        console.error("User pool ID not found");
        return JSON.stringify({ users: [], error: "User pool ID not found" });
      }

      const cognito = getCognitoClient();
      if (!cognito) {
        console.error("Cognito client not initialized");
        return JSON.stringify({ users: [], error: "Cognito client not initialized" });
      }

      // Log environment variables for debugging
      console.log(
        "Environment variables check:",
        {
          AUTH_USERPOOL_ID: userPoolId ? "Set" : "Not set",
          EMAIL_SENDER: process.env.EMAIL_SENDER ? "Set" : "Not set",
        }
      );

      const command = new ListUsersCommand({
        UserPoolId: userPoolId,
        Limit: 60,
      });

      const response = await cognito.send(command);
      const users = response.Users || [];

      console.log(`Cognito ListUsers response: Found ${users.length} users`);

      // Map users to a more usable format
      const mappedUsers = users.map((user) => {
        // Extract attributes into an easy to access object
        const attributes: Record<string, string> = {};
        user.Attributes?.forEach((attr) => {
          if (attr.Name && attr.Value) {
            attributes[attr.Name] = attr.Value;
          }
        });

        // Get custom status if available
        const customStatus = attributes["custom:status"] || null;

        return {
          email: user.Username,
          status: user.UserStatus,
          enabled: user.Enabled,
          created: user.UserCreateDate,
          lastModified: user.UserLastModifiedDate,
          attributes,
          customStatus
        };
      });

      return JSON.stringify(mappedUsers);
    } catch (error) {
      console.error("Error listing users:", error);
      return JSON.stringify({ 
        users: [], 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  },

  // Get users by status
  getUsersByStatus: async (status: string): Promise<string> => {
    try {
      const usersResult = await userOperations.listUsers();
      let allUsers: UserData[] = [];
      
      try {
        // Parse the result string
        const parsedResult = JSON.parse(usersResult);
        
        // Check if it's an error response
        if (parsedResult.error) {
          console.error("Error in listUsers:", parsedResult.error);
          return JSON.stringify([]);
        }
        
        // If it's an array, use it
        if (Array.isArray(parsedResult)) {
          allUsers = parsedResult;
        } else if (parsedResult.users && Array.isArray(parsedResult.users)) {
          // If it has a users property that's an array, use that
          allUsers = parsedResult.users;
        } else {
          console.error("Unexpected response format from listUsers");
          return JSON.stringify([]);
        }
      } catch (parseError) {
        console.error("Error parsing listUsers result:", parseError);
        return JSON.stringify([]);
      }
      
      const filteredUsers = allUsers.filter((user: UserData) => {
        switch (status.toLowerCase()) {
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
      
      return JSON.stringify(filteredUsers);
    } catch (error) {
      console.error("Error getting users by status:", error);
      return JSON.stringify([]);
    }
  },

  // Get user details
  getUserDetails: async (email: string): Promise<UserData> => {
    try {
      const userPoolId = getUserPoolId();
      console.log("Using Cognito UserPoolId:", userPoolId);
      if (!userPoolId || !cognito) {
        throw new Error("Missing UserPoolId or Cognito client not initialized");
      }

      const command = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });

      const response = await cognito.send(command);

      const attributes: Record<string, string> = {};
      if (response.UserAttributes) {
        response.UserAttributes.forEach((attr: AttributeType) => {
          if (attr.Name && attr.Value) {
            attributes[attr.Name] = attr.Value;
          }
        });
      }

      return {
        email,
        status: response.UserStatus,
        enabled: response.Enabled,
        created: response.UserCreateDate,
        lastModified: response.UserLastModifiedDate,
        attributes,
      };
    } catch (error) {
      console.error(`Error getting user details for ${email}:`, error);
      return {
        email,
        status: "unknown",
        enabled: false,
        created: undefined,
        lastModified: undefined,
        attributes: {},
      };
    }
  },

  // Approve user
  approveUser: async (email: string): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId || !cognito) {
        throw new Error("Missing UserPoolId or Cognito client not initialized");
      }

      // Add user to appropriate groups
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: "Approved-Users",
      });

      await cognito.send(addToGroupCommand);

      // Send approval email
      await sendEmail({
        to: email,
        subject: "Welcome to MC3 GRC Platform - Your Account is Approved",
        message: approvalTemplate(),
      });

      return true;
    } catch (error) {
      console.error(`Error approving user ${email}:`, error);
      return false;
    }
  },

  // Reject user
  rejectUser: async (
    email: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId) {
        console.error("User pool ID not found");
        return false;
      }

      const cognito = getCognitoClient();

      // First get the user to capture current state
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });

      try {
        await cognito.send(getUserCommand);
      } catch (error) {
        console.error(`User ${email} not found:`, error);
        return false;
      }

      // Disable the user
      const disableCommand = new AdminDisableUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });

      await cognito.send(disableCommand);

      // Add a custom attribute to mark as REJECTED (different from SUSPENDED)
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:status",
            Value: "REJECTED",
          },
        ],
      });

      await cognito.send(updateAttributesCommand);

      // Send rejection email if there's a reason
      if (reason) {
        const emailSent = await sendEmail({
          to: email,
          subject: "MC3 GRC Platform - Application Status Update",
          message: rejectionTemplate({ reason }),
        });

        if (!emailSent) {
          console.warn(`Failed to send rejection email to ${email}`);
        }
      }

      return true;
    } catch (error) {
      console.error("Error rejecting user:", error);
      return false;
    }
  },

  // Suspend user
  suspendUser: async (
    email: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId) {
        console.error("User pool ID not found");
        return false;
      }

      const cognito = getCognitoClient();

      // Disable the user
      const disableCommand = new AdminDisableUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });

      await cognito.send(disableCommand);

      // Add a custom attribute to mark as SUSPENDED
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:status",
            Value: "SUSPENDED",
          },
        ],
      });

      await cognito.send(updateAttributesCommand);

      // Send suspension email if there's a reason
      if (reason) {
        const emailSent = await sendEmail({
          to: email,
          subject: "MC3 GRC Platform - Account Status Update",
          message: suspensionTemplate({ reason }),
        });

        if (!emailSent) {
          console.warn(`Failed to send suspension email to ${email}`);
        }
      }

      return true;
    } catch (error) {
      console.error("Error suspending user:", error);
      return false;
    }
  },

  // Reactivate user
  reactivateUser: async (email: string): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId || !cognito) {
        throw new Error("Missing UserPoolId or Cognito client not initialized");
      }

      // Enable the user in Cognito
      const enableCommand = new AdminEnableUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });

      await cognito.send(enableCommand);

      // Clear the custom status attribute to mark as ACTIVE
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:status",
            Value: "ACTIVE",
          },
        ],
      });

      await cognito.send(updateAttributesCommand);

      // Send reactivation email
      await sendEmail({
        to: email,
        subject: "MC3 GRC Platform - Your Account Has Been Reactivated",
        message: reactivationTemplate(),
      });

      return true;
    } catch (error) {
      console.error(`Error reactivating user ${email}:`, error);
      return false;
    }
  },

  // Create user
  createUser: async (
    email: string,
    role: string,
    sendEmailNotification: boolean = true,
  ): Promise<{ success: boolean; user?: any; error?: string }> => {
    try {
      const userPoolId = getUserPoolId();
      
      // Log which user pool ID is being used for debugging
      console.log("Creating user with user pool ID:", userPoolId);
      
      if (!userPoolId || !cognito) {
        throw new Error("Missing UserPoolId or Cognito client not initialized");
      }

      // Use our secure password generator
      const tempPassword = generateSecurePassword();

      // Create user in Cognito
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
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
        TemporaryPassword: tempPassword,
        // Set message action based on sendEmailNotification flag
        MessageAction: sendEmailNotification
          ? ("SEND" as MessageActionType)
          : ("SUPPRESS" as MessageActionType),
      });

      const response = await cognito.send(createCommand);

      // Add to appropriate group
      const groupName = role === "admin" ? "GRC-Admin" : "Approved-Users";

      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: groupName,
      });

      await cognito.send(addToGroupCommand);

      return {
        success: true,
        user: response.User,
      };
    } catch (error) {
      console.error(`Error creating user ${email}:`, error);
      const typedError = error as Error;
      return {
        success: false,
        error: typedError.message,
      };
    }
  },

  // Update user role
  updateUserRole: async (email: string, role: string): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId || !cognito) {
        throw new Error("Missing UserPoolId or Cognito client not initialized");
      }

      console.log(`Updating role for user ${email} to ${role}`);

      // Update custom:role attribute
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:role",
            Value: role,
          },
        ],
      });
      await cognito.send(updateAttributesCommand);
      console.log(`User attributes updated for ${email}`);

      // Get current groups
      try {
        const listGroupsCommand = new AdminListGroupsForUserCommand({
          UserPoolId: userPoolId,
          Username: email,
        });
        const groupsResponse = await cognito.send(listGroupsCommand);
        
        // Remove from existing groups
        if (groupsResponse.Groups) {
          for (const group of groupsResponse.Groups) {
            if (group.GroupName) {
              console.log(`Removing user from group: ${group.GroupName}`);
              const removeCommand = new AdminRemoveUserFromGroupCommand({
                UserPoolId: userPoolId,
                Username: email,
                GroupName: group.GroupName,
              });
              await cognito.send(removeCommand);
            }
          }
        }
      } catch (error) {
        console.warn(`Error managing user groups: ${error}`);
      }

      // Add to appropriate group
      const groupName = role === "admin" ? "GRC-Admin" : "Approved-Users";
      console.log(`Adding user to group: ${groupName}`);
      
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: groupName,
      });
      await cognito.send(addToGroupCommand);

      return true;
    } catch (error) {
      console.error(`Error updating role for ${email}:`, error);
      return false;
    }
  },
};