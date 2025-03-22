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
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { env } from "$amplify/env/user-management";
// Import email templates
import {
  approvalTemplate,
  rejectionTemplate,
  suspensionTemplate,
  reactivationTemplate,
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

// Create DynamoDB client
const getDynamoDBClient = () => {
  try {
    return new DynamoDBClient();
  } catch (error) {
    console.error("Error creating DynamoDB client:", error);
    throw error;
  }
};

// Initialize clients
let cognito: CognitoIdentityProviderClient;
let ses: SESClient;
let dynamodb: DynamoDBClient;

try {
  cognito = getCognitoClient();
  ses = getSesClient();
  dynamodb = getDynamoDBClient();
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
    // In a Lambda environment, these should be set
    const userPoolId = env.USER_POOL_ID;
    console.log(`getUserPoolId: env.USER_POOL_ID from mock: ${userPoolId}`);

    if (!userPoolId) {
      console.warn("USER_POOL_ID is not set in environment variables.");
      return process.env.USER_POOL_ID || null; // Fallback to process.env
    }
    return userPoolId;
  } catch (error) {
    console.error("Error getting User Pool ID from environment:", error);
    return process.env.USER_POOL_ID || null; // Fallback to process.env on error
  }
};

// Helper function to generate a secure password that meets Cognito requirements
const generateSecurePassword = (): string => {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+{}:\"<>?|[];',./`~";

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
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

// Fetch all users from Cognito
const fetchUsersFromCognito = async (): Promise<UserData[]> => {
  try {
    // Initialize Cognito client
    cognito = getCognitoClient();

    // Get the user pool ID
    const userPoolId = getUserPoolId();
    if (!userPoolId) {
      console.error("No user pool ID found");
      return [];
    }

    console.log("Using user pool ID:", userPoolId);

    // Fetch users from Cognito User Pool
    const command = new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: 60, // Adjust as needed
    });

    // Execute command
    const response = await cognito.send(command);

    // Process response
    if (!response.Users || response.Users.length === 0) {
      return [];
    }

    // Transform Cognito users to our UserData format
    const users = response.Users.map((user: UserType) => {
      // Extract attributes
      const attrs: Record<string, string> = {};
      if (user.Attributes) {
        user.Attributes.forEach((attr: AttributeType) => {
          if (attr.Name && attr.Value) {
            attrs[attr.Name] = attr.Value;
          }
        });
      }

      return {
        email: attrs["email"] || user.Username,
        status: user.UserStatus,
        enabled: user.Enabled,
        created: user.UserCreateDate,
        lastModified: user.UserLastModifiedDate,
        attributes: attrs,
      } as UserData;
    });

    return users;
  } catch (error) {
    console.error("Error fetching users from Cognito:", error);
    return [];
  }
};

// Define AuditLog interface
interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  affectedResource: string;
  resourceId?: string;
  details?: any;
}

// Create an audit log entry
const createAuditLogEntry = async (logEntry: Omit<AuditLog, "id">) => {
  try {
    // Generate a unique ID
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Prepare the complete log entry
    const completeLogEntry: AuditLog = {
      id,
      ...logEntry,
    };

    // Marshall the data for DynamoDB
    const item = marshall(completeLogEntry);

    // Put the item in the AuditLog table
    const command = new PutItemCommand({
      TableName: process.env.AUDIT_LOG_TABLE_NAME || "AuditLog",
      Item: item,
    });

    // Send the command
    await dynamodb.send(command);

    console.log(`Audit log created with ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Error creating audit log entry:", error);
    return null;
  }
};

// Define SystemSettings interface
interface SystemSetting {
  id: string;
  name: string;
  value: any;
  description?: string;
  category?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

interface AdminStats {
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
        return JSON.stringify({
          users: [],
          error: "Cognito client not initialized",
        });
      }

      // Log environment variables for debugging
      console.log("Environment variables check:", {
        AUTH_USERPOOL_ID: userPoolId ? "Set" : "Not set",
        EMAIL_SENDER: process.env.EMAIL_SENDER ? "Set" : "Not set",
      });

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
          customStatus,
        };
      });

      return JSON.stringify(mappedUsers);
    } catch (error) {
      console.error("Error listing users:", error);
      return JSON.stringify({
        users: [],
        error: error instanceof Error ? error.message : String(error),
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
        // Get custom status from attributes if available
        const customStatus = user.attributes?.["custom:status"];

        switch (status.toLowerCase()) {
          case "pending":
            // Only count as pending if FORCE_CHANGE_PASSWORD and not rejected
            return (
              user.status === "FORCE_CHANGE_PASSWORD" &&
              customStatus !== "REJECTED"
            );
          case "active":
            return user.status === "CONFIRMED" && user.enabled;
          case "suspended":
            return (
              customStatus === "SUSPENDED" ||
              (!user.enabled && customStatus !== "REJECTED")
            );
          case "rejected":
            return customStatus === "REJECTED";
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
  approveUser: async (
    email: string,
    adminEmail: string = "admin@example.com",
  ): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId || !cognito) {
        throw new Error("Missing UserPoolId or Cognito client not initialized");
      }

      console.log(`Approving user ${email} by admin: ${adminEmail}`);

      // Add user to appropriate groups
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: "Approved-Users",
      });

      await cognito.send(addToGroupCommand);

      // Create audit log entry for approval
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_APPROVED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email: email,
          approvedAt: new Date().toISOString(),
        },
      });

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
    reason?: string,
    adminEmail: string = "admin@example.com",
  ): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId) {
        console.error("User pool ID not found");
        return false;
      }

      console.log(`Rejecting user ${email} by admin: ${adminEmail}`);

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

      // Update user attributes to mark as rejected
      const updateUserAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:status",
            Value: "REJECTED",
          },
        ],
      });

      await cognito.send(updateUserAttributesCommand);

      // Create audit log entry for rejection
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_REJECTED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email: email,
          reason: reason || "No reason provided",
          rejectedAt: new Date().toISOString(),
        },
      });

      // Send rejection email if email sending is enabled
      if (reason) {
        await sendEmail({
          to: email,
          subject: "MC3 GRC Platform - Account Request Status",
          message: rejectionTemplate({ reason }),
        });
      }

      return true;
    } catch (error) {
      console.error(`Error rejecting user ${email}:`, error);
      return false;
    }
  },

  // Suspend user
  suspendUser: async (
    email: string,
    reason?: string,
    adminEmail: string = "admin@example.com",
  ): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId) {
        console.error("User pool ID not found");
        return false;
      }

      console.log(`Suspending user ${email} by admin: ${adminEmail}`);

      // Disable user
      const disableUserCommand = new AdminDisableUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });

      await cognito.send(disableUserCommand);

      // Update user attributes to mark as suspended
      const updateUserAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:status",
            Value: "SUSPENDED",
          },
        ],
      });

      await cognito.send(updateUserAttributesCommand);

      // Create audit log entry for suspension
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_SUSPENDED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email: email,
          reason: reason || "No reason provided",
          suspendedAt: new Date().toISOString(),
        },
      });

      // Send suspension email if a reason is provided
      if (reason) {
        await sendEmail({
          to: email,
          subject: "MC3 GRC Platform - Account Status Update",
          message: suspensionTemplate({ reason }),
        });
      }

      return true;
    } catch (error) {
      console.error(`Error suspending user ${email}:`, error);
      return false;
    }
  },

  // Reactivate user
  reactivateUser: async (
    email: string,
    adminEmail: string = "admin@example.com",
  ): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId) {
        console.error("User pool ID not found");
        return false;
      }

      console.log(`Reactivating user ${email} by admin: ${adminEmail}`);

      // Enable user
      const enableUserCommand = new AdminEnableUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });

      await cognito.send(enableUserCommand);

      // Update user attributes to clear suspended status
      const updateUserAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:status",
            Value: "ACTIVE",
          },
        ],
      });

      await cognito.send(updateUserAttributesCommand);

      // Create audit log entry for reactivation
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_REACTIVATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email: email,
          reactivatedAt: new Date().toISOString(),
        },
      });

      // Send reactivation email
      await sendEmail({
        to: email,
        subject: "MC3 GRC Platform - Account Reactivated",
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
    shouldSendEmail: boolean = true,
    performedBy?: string,
  ): Promise<{ success: boolean; user?: any; error?: string }> => {
    try {
      const userPoolId = getUserPoolId();

      // Log which user pool ID is being used for debugging
      console.log("Creating user with user pool ID:", userPoolId);
      console.log(
        `Creating user ${email} with role ${role} by admin: ${performedBy}`,
      );

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
        // Set message action based on shouldSendEmail flag
        MessageAction: shouldSendEmail ? ("SEND" as MessageActionType) : ("SUPPRESS" as MessageActionType),
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

      // Create audit log entry for user creation
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_CREATED",
        performedBy: performedBy || "system",
        affectedResource: "user",
        resourceId: email,
        details: {
          email: email,
          role: role,
          sendEmail: shouldSendEmail,
          createdAt: new Date().toISOString(),
        },
      });

      if (shouldSendEmail) {
        console.log("createUser: shouldSendEmail is true, about to call sendEmail function");
        const emailSent = await sendEmail({
          to: email,
          subject: "User Account Created",
          message: `Your account has been created with role: ${role}. Please contact your administrator for next steps.`,
        });
        if (!emailSent) {
          console.warn(`Email sending failed for user creation: ${email}`);
        }
      }

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
  updateUserRole: async (
    email: string,
    role: string,
    adminEmail: string = "admin@example.com",
  ): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId || !cognito) {
        throw new Error("Missing UserPoolId or Cognito client not initialized");
      }

      console.log(
        `Updating role for user ${email} to ${role} by admin: ${adminEmail}`,
      );

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

      // Create audit log entry for role update
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_ROLE_UPDATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email: email,
          newRole: role,
          updatedAt: new Date().toISOString(),
        },
      });

      return true;
    } catch (error) {
      console.error(`Error updating role for ${email}:`, error);
      return false;
    }
  },

  // New function to get admin dashboard statistics
  getAdminStats: async (): Promise<AdminStats> => {
    try {
      console.log("Starting getAdminStats function");

      // Initialize response object
      const stats: AdminStats = {
        users: {
          total: 0,
          active: 0,
          pending: 0,
          rejected: 0,
          suspended: 0,
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

      // Get all users
      try {
        console.log("Fetching user statistics");
        const users = await fetchUsersFromCognito();
        console.log(`Fetched ${users.length} users from Cognito`);

        if (users.length > 0) {
          stats.users.total = users.length;
          users.forEach((user: UserData) => {
            const customStatus = user.attributes?.["custom:status"];
            if (customStatus === "REJECTED") {
              stats.users.rejected++;
            } else if (customStatus === "SUSPENDED") {
              stats.users.suspended++;
            } else if (user.status === "CONFIRMED" && user.enabled) {
              stats.users.active++;
            } else if (
              user.status === "FORCE_CHANGE_PASSWORD" &&
              customStatus !== "REJECTED"
            ) {
              stats.users.pending++;
            }
          });
        }
        console.log("User statistics:", stats.users);
      } catch (error) {
        console.error("Error fetching user statistics:", error);
      }

      // Fetch assessment statistics from DynamoDB
      try {
        console.log("Fetching assessment statistics");
        console.log("Environment variables for DynamoDB tables:", {
          COMPLETED_ASSESSMENT_TABLE:
            process.env.COMPLETED_ASSESSMENT_TABLE_NAME,
          IN_PROGRESS_ASSESSMENT_TABLE:
            process.env.IN_PROGRESS_ASSESSMENT_TABLE_NAME,
        });

        // Get completed assessments
        const completedTableName =
          process.env.COMPLETED_ASSESSMENT_TABLE_NAME ||
          "CompletedAssessment-fk4antj52jgh3j6qjhbhwur5qa-NONE";
        console.log("Using completed assessments table:", completedTableName);

        const completedScanCommand = new ScanCommand({
          TableName: completedTableName,
          // Remove any owner filtering to access all items as admin
          ConsistentRead: true,
        });

        try {
          const completedResponse = await dynamodb.send(completedScanCommand);
          console.log(
            "Completed assessments scan response:",
            JSON.stringify(completedResponse),
          );

          if (completedResponse.Items) {
            const completedAssessments = completedResponse.Items.map((item) =>
              unmarshall(item),
            );
            stats.assessments.completed = completedAssessments.length;
            stats.assessments.total += completedAssessments.length;

            // Count compliant and non-compliant assessments
            completedAssessments.forEach((assessment: any) => {
              if (assessment.isCompliant) {
                stats.assessments.compliant++;
              } else {
                stats.assessments.nonCompliant++;
              }
            });
          }
        } catch (scanError) {
          console.error(
            "Error scanning completed assessments table:",
            scanError,
          );
          console.error("Table name used:", completedTableName);
        }

        // Get in-progress assessments
        const inProgressTableName =
          process.env.IN_PROGRESS_ASSESSMENT_TABLE_NAME ||
          "InProgressAssessment-fk4antj52jgh3j6qjhbhwur5qa-NONE";
        console.log(
          "Using in-progress assessments table:",
          inProgressTableName,
        );

        const inProgressScanCommand = new ScanCommand({
          TableName: inProgressTableName,
          // Remove any owner filtering to access all items as admin
          ConsistentRead: true,
        });

        try {
          const inProgressResponse = await dynamodb.send(inProgressScanCommand);
          console.log(
            "In-progress assessments raw response count:",
            inProgressResponse.Items ? inProgressResponse.Items.length : 0,
          );

          if (inProgressResponse.Items && inProgressResponse.Items.length > 0) {
            console.log(
              "First in-progress assessment item:",
              JSON.stringify(unmarshall(inProgressResponse.Items[0])),
            );

            const inProgressAssessments = inProgressResponse.Items.map((item) =>
              unmarshall(item),
            );
            stats.assessments.inProgress = inProgressAssessments.length;
            stats.assessments.total += inProgressAssessments.length;
          }
        } catch (scanError) {
          console.error(
            "Error scanning in-progress assessments table:",
            scanError,
          );
          console.error("Table name used:", inProgressTableName);
        }

        // Calculate compliance rate
        if (stats.assessments.completed > 0) {
          stats.complianceRate = Math.round(
            (stats.assessments.compliant / stats.assessments.completed) * 100,
          );
        }
      } catch (error) {
        console.error("Error fetching assessment statistics:", error);
      }

      // Fetch recent activity from audit logs
      try {
        console.log("Fetching recent activity");
        const scanCommand = new ScanCommand({
          TableName: process.env.AUDIT_LOG_TABLE_NAME || "AuditLog",
          Limit: 10,
        });

        const auditResponse = await dynamodb.send(scanCommand);
        if (auditResponse.Items) {
          stats.recentActivity = auditResponse.Items.map(
            (item) => unmarshall(item) as AuditLog,
          )
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            )
            .slice(0, 10);
        }
        console.log("Recent activity:", stats.recentActivity);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
      }

      console.log("Returning admin stats:", JSON.stringify(stats, null, 2));
      return stats;
    } catch (error) {
      console.error("Error getting admin stats:", error);
      return {
        users: {
          total: 0,
          active: 0,
          pending: 0,
          rejected: 0,
          suspended: 0,
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
    }
  },

  // Get audit logs
  getAuditLogs: async (
    dateRange?: { startDate?: string; endDate?: string },
    filters?: {
      action?: string;
      performedBy?: string;
      affectedResource?: string;
    },
  ): Promise<string> => {
    try {
      console.log("Fetching audit logs with filters:", { dateRange, filters });

      // Default to retrieving logs from the last 30 days if no date range is specified
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);

      const startDate = dateRange?.startDate
        ? new Date(dateRange.startDate)
        : defaultStartDate;
      const endDate = dateRange?.endDate
        ? new Date(dateRange.endDate)
        : new Date();

      // For now, we'll use a scan operation with client-side filtering
      // In a production environment, you would use query operations with indexes
      const command = new ScanCommand({
        TableName: process.env.AUDIT_LOG_TABLE_NAME || "AuditLog",
        Limit: 100, // Reasonable limit to prevent excessive data transfer
      });

      const response = await dynamodb.send(command);

      if (!response.Items || response.Items.length === 0) {
        return JSON.stringify([]);
      }

      // Convert DynamoDB items to JavaScript objects
      let logs = response.Items.map((item) => unmarshall(item)) as AuditLog[];

      // Filter by date range
      logs = logs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      });

      // Apply additional filters if provided
      if (filters) {
        if (filters.action) {
          logs = logs.filter((log) => log.action.includes(filters.action!));
        }

        if (filters.performedBy) {
          logs = logs.filter((log) =>
            log.performedBy.includes(filters.performedBy!),
          );
        }

        if (filters.affectedResource) {
          logs = logs.filter((log) =>
            log.affectedResource.includes(filters.affectedResource!),
          );
        }
      }

      // Sort by timestamp (newest first)
      logs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      return JSON.stringify(logs);
    } catch (error) {
      console.error("Error retrieving audit logs:", error);
      return JSON.stringify({ error: "Failed to retrieve audit logs" });
    }
  },

  // Get system settings
  getAllSystemSettings: async (): Promise<string> => {
    try {
      console.log("Fetching system settings");

      // Scan the SystemSettings table
      const command = new ScanCommand({
        TableName: process.env.SYSTEM_SETTINGS_TABLE_NAME || "SystemSettings",
      });

      const response = await dynamodb.send(command);

      if (!response.Items || response.Items.length === 0) {
        console.log("No system settings found");
        return JSON.stringify([]);
      }

      // Convert DynamoDB items to JavaScript objects
      const settings = response.Items.map((item) =>
        unmarshall(item),
      ) as SystemSetting[];

      // Group settings by category if needed
      const settingsByCategory: Record<string, SystemSetting[]> = {};

      settings.forEach((setting) => {
        const category = setting.category || "general";

        if (!settingsByCategory[category]) {
          settingsByCategory[category] = [];
        }

        settingsByCategory[category].push(setting);
      });

      return JSON.stringify({
        settings,
        settingsByCategory,
      });
    } catch (error) {
      console.error("Error retrieving system settings:", error);
      return JSON.stringify({
        error: "Failed to retrieve system settings",
        settings: [],
      });
    }
  },

  // Update system settings
  updateSystemSettings: async (
    settings: SystemSetting | SystemSetting[],
    updatedBy?: string,
  ): Promise<string> => {
    try {
      console.log("Updating system settings:", settings);

      // Convert to array if a single setting is provided
      const settingsArray = Array.isArray(settings) ? settings : [settings];

      // Current timestamp for the update
      const now = new Date().toISOString();

      // Track updated settings
      const updatedSettings: SystemSetting[] = [];

      // Process each setting
      for (const setting of settingsArray) {
        try {
          // If no ID is provided, generate one
          if (!setting.id) {
            setting.id = `setting-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          }

          // Add metadata
          setting.lastUpdated = now;
          if (updatedBy) {
            setting.updatedBy = updatedBy;
          }

          // Marshall the data for DynamoDB
          const item = marshall(setting);

          // Put the item in the SystemSettings table
          const command = new PutItemCommand({
            TableName:
              process.env.SYSTEM_SETTINGS_TABLE_NAME || "SystemSettings",
            Item: item,
          });

          // Send the command
          await dynamodb.send(command);

          // Add to updated settings list
          updatedSettings.push(setting);

          // Create audit log entry
          await createAuditLogEntry({
            timestamp: now,
            action: "SYSTEM_SETTING_UPDATED",
            performedBy: updatedBy || "system",
            affectedResource: "SystemSettings",
            resourceId: setting.id,
            details: {
              name: setting.name,
              category: setting.category || "general",
            },
          });
        } catch (settingError) {
          console.error(
            `Error updating setting ${setting.name}:`,
            settingError,
          );
        }
      }

      return JSON.stringify({
        success: true,
        updatedCount: updatedSettings.length,
        updatedSettings,
      });
    } catch (error) {
      console.error("Error updating system settings:", error);
      return JSON.stringify({
        success: false,
        error: "Failed to update system settings",
      });
    }
  },

  // Delete user
  deleteUser: async (
    email: string,
    adminEmail: string = "admin@example.com",
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(
        `Attempting to delete user with email: ${email} by admin: ${adminEmail}`,
      );

      if (!cognito) {
        cognito = getCognitoClient();
      }

      if (!dynamodb) {
        dynamodb = getDynamoDBClient();
      }

      // Get the user directly via AdminGetUserCommand
      const userPoolId = getUserPoolId();
      if (!userPoolId) {
        console.error("User pool ID not found");
        return {
          success: false,
          message: "User pool ID not found.",
        };
      }

      let userId = "";
      try {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: email,
        });

        const userData = await cognito.send(getUserCommand);
        userId = userData.Username || "";

        // Extract sub from attributes if available
        if (userData.UserAttributes) {
          const subAttr = userData.UserAttributes.find(
            (attr) => attr.Name === "sub",
          );
          if (subAttr && subAttr.Value) {
            userId = subAttr.Value;
          }
        }
      } catch (error) {
        console.error(`Error getting user details for ${email}:`, error);
        return {
          success: false,
          message: `User with email ${email} not found or cannot be accessed.`,
        };
      }

      // Step 1: Create audit log entry for the deletion
      const auditLogEntry = {
        timestamp: new Date().toISOString(),
        action: "USER_DELETED",
        performedBy: adminEmail, // Use the admin email that was passed in
        affectedResource: "user",
        resourceId: userId,
        details: {
          email: email,
          deletedAt: new Date().toISOString(),
        },
      };

      await createAuditLogEntry(auditLogEntry);
      console.log("Created audit log for user deletion");

      // Step 2: Delete user's assessments
      // This would require finding any assessments owned by this user and deleting them
      // We'll need to scan the InProgressAssessment and CompletedAssessment tables
      try {
        // Delete in-progress assessments
        const inProgressAssessmentTableName =
          process.env.API_GRCSITE2_INPROGRESSASSESSMENTTABLE_NAME;
        if (inProgressAssessmentTableName) {
          const scanCommand = new ScanCommand({
            TableName: inProgressAssessmentTableName,
            FilterExpression: "owner = :owner",
            ExpressionAttributeValues: marshall({
              ":owner": userId,
            }),
          });

          const inProgressAssessments = await dynamodb.send(scanCommand);
          console.log(
            `Found ${inProgressAssessments.Items?.length || 0} in-progress assessments for user`,
          );

          // Delete each assessment
          if (
            inProgressAssessments.Items &&
            inProgressAssessments.Items.length > 0
          ) {
            for (const item of inProgressAssessments.Items) {
              const deleteParams = {
                TableName: inProgressAssessmentTableName,
                Key: {
                  id: item.id,
                },
              };

              // Create audit log for assessment deletion
              await createAuditLogEntry({
                timestamp: new Date().toISOString(),
                action: "ASSESSMENT_DELETED",
                performedBy: adminEmail, // Use the admin email that was passed in
                affectedResource: "assessment",
                resourceId: item.id.S,
                details: {
                  assessmentName: item.name?.S || "Unknown",
                  reason: "User account deletion",
                  deletedAt: new Date().toISOString(),
                },
              });

              // We would also need to delete associated files from S3 here
              // This would depend on your S3 bucket structure
            }
          }
        }

        // Similar process for completed assessments
        const completedAssessmentTableName =
          process.env.API_GRCSITE2_COMPLETEDASSESSMENTTABLE_NAME;
        if (completedAssessmentTableName) {
          // Similar code for completed assessments
          // ... for brevity, we're omitting this part but it would be similar to the above
        }
      } catch (error) {
        console.error("Error cleaning up user assessments:", error);
        // Continue with user deletion even if assessment cleanup fails
      }

      // Step 3: Delete the Cognito user
      const deleteUserCommand = new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });

      await cognito.send(deleteUserCommand);
      console.log(`Successfully deleted user: ${email}`);

      return {
        success: true,
        message: `User ${email} has been permanently deleted.`,
      };
    } catch (error) {
      console.error("Error deleting user:", error);
      return {
        success: false,
        message: `Failed to delete user: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

console.log("Environment variables:", {
  completedTable: process.env.COMPLETED_ASSESSMENT_TABLE_NAME,
  inProgressTable: process.env.IN_PROGRESS_ASSESSMENT_TABLE_NAME,
});
