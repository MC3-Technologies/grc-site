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
  GetItemCommand,
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
export const sendEmail = async ({
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
    console.log(`getUserPoolId: env.USER_POOL_ID: ${userPoolId}`);

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

interface UserStatus {
  id: string;
  email: string;
  status: "pending" | "active" | "suspended" | "rejected" | "deleted";
  role: "user" | "admin";
  lastLogin?: string;
  registrationDate: string;
  notes?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  approvedBy?: string;
  lastStatusChange?: string;
  lastStatusChangeBy?: string;
}

// Helper to update user status in DynamoDB and log it
const updateUserStatus = async (
  email: string,
  newStatus: UserStatus["status"],
  updatedBy: string = "system",
  reason?: string, // Add optional reason parameter
  ttl?: number,
): Promise<void> => {
  const tableName =
    process.env.USER_STATUS_TABLE_NAME ||
    "UserStatus-fk4antj52jgh3j6qjhbhwur5qa-NONE";
  const timestamp = new Date().toISOString();

  // Ensure status is always lowercase for consistency in DynamoDB
  const normalizedStatus = newStatus.toLowerCase() as UserStatus["status"];

  // Prepare the item to store in DynamoDB
  const item: any = {
    id: email,
    email,
    status: normalizedStatus,
    lastStatusChange: timestamp,
    lastStatusChangeBy: updatedBy,
  };

  // Add reason if provided and status is relevant
  if (reason) {
    if (normalizedStatus === "rejected") {
      item.rejectionReason = reason;
    } else if (normalizedStatus === "suspended") {
      item.suspensionReason = reason;
    }
  }

  // Add TTL if provided (for deleted items)
  if (ttl) {
    item.ttl = ttl;
  }

  const updateCommand = new PutItemCommand({
    TableName: tableName,
    Item: marshall(item, { removeUndefinedValues: true }),
  });

  await dynamodb.send(updateCommand);
  console.log(`Updated UserStatus: ${email} → ${normalizedStatus}`);

  // REMOVED: No longer creating generic USER_STATUS_UPDATED audit log entries
  // Specific user actions (approve, reject, etc.) should create their own
  // targeted audit logs with appropriate action types
};

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

    // Clean up any undefined values in the details object
    if (completeLogEntry.details) {
      Object.keys(completeLogEntry.details).forEach((key) => {
        if (
          completeLogEntry.details &&
          completeLogEntry.details[key] === undefined
        ) {
          delete completeLogEntry.details[key];
        }
      });
    }

    // Marshall the data for DynamoDB with removeUndefinedValues option
    const item = marshall(completeLogEntry, { removeUndefinedValues: true });

    // Put the item in the AuditLog table
    const command = new PutItemCommand({
      TableName:
        process.env.AUDIT_LOG_TABLE_NAME ||
        "AuditLog-fk4antj52jgh3j6qjhbhwur5qa-NONE ",
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
      const dynamodb = getDynamoDBClient();

      const command = new ListUsersCommand({
        UserPoolId: userPoolId,
        Limit: 60,
      });

      const response = await cognito.send(command);
      const users = response.Users || [];

      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          const attributes: Record<string, string> = {};
          user.Attributes?.forEach((attr) => {
            if (attr.Name && attr.Value) {
              attributes[attr.Name] = attr.Value;
            }
          });

          const email = attributes["email"] || user.Username;
          const customStatus = attributes["custom:status"] || null;

          let dbStatus: Partial<UserStatus> = {};
          try {
            const dbResponse = await dynamodb.send(
              new GetItemCommand({
                TableName:
                  process.env.USER_STATUS_TABLE_NAME ||
                  "UserStatus-fk4antj52jgh3j6qjhbhwur5qa-NONE", // Use env var
                Key: marshall({ id: email }),
              }),
            );

            if (dbResponse.Item) {
              dbStatus = unmarshall(dbResponse.Item) as Partial<UserStatus>;
            }
          } catch (err) {
            console.warn(
              `No DynamoDB UserStatus record found for ${email}`,
              err,
            );
          }

          // Combine data from Cognito and DynamoDB, ensuring profile attributes are included
          // Prioritize custom attributes, fall back to standard attributes
          return {
            email,
            status: dbStatus.status || customStatus || user.UserStatus, // Prioritize DB status
            role: dbStatus.role || attributes["custom:role"] || "user", // Prioritize DB role
            created:
              dbStatus.registrationDate || user.UserCreateDate?.toISOString(), // Use registrationDate or UserCreateDate
            lastModified:
              dbStatus.lastStatusChange ||
              user.UserLastModifiedDate?.toISOString(), // Use lastStatusChange or UserLastModifiedDate
            enabled: user.Enabled,
            attributes, // Include all Cognito attributes
            // Add profile attributes directly for easier frontend access
            firstName:
              attributes["custom:firstName"] || attributes["given_name"], // Prioritize custom
            lastName:
              attributes["custom:lastName"] || attributes["family_name"], // Prioritize custom
            companyName: attributes["custom:companyName"], // Use custom attribute
          };
        }),
      );

      return JSON.stringify(enrichedUsers);
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
      const tableName =
        process.env.USER_STATUS_TABLE_NAME ||
        "UserStatus-fk4antj52jgh3j6qjhbhwur5qa-NONE";
      const indexName = "status-index";
      const dynamodb = getDynamoDBClient();

      // Validate status is provided
      if (!status) {
        throw new Error("Status parameter is required.");
      }

      const queryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: "#status = :statusVal",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":statusVal": { S: status.toLowerCase() },
        },
      });

      const response = await dynamodb.send(queryCommand);

      const users = (response.Items || []).map((item) => {
        const parsed = unmarshall(item) as UserStatus;

        // Transform to match listUsers() format that the UI expects
        // Fetch additional Cognito details if needed (like name/company)
        // For now, just return what's in DynamoDB
        return {
          email: parsed.email,
          status: parsed.status,
          customStatus: parsed.status, // Add this for frontend consistency
          role: parsed.role || "user",
          created: parsed.registrationDate,
          lastModified: parsed.lastStatusChange,
          enabled: true, // Assume enabled since we're returning active records
          // We might need to fetch Cognito attributes here if needed
        };
      });

      console.log(`Found ${users.length} users with status: ${status}`);
      return JSON.stringify(users);
    } catch (error) {
      console.error("Error in getUsersByStatus:", error);
      return JSON.stringify({ error: "Failed to retrieve users by status" });
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

      // 1. Enable the user in Cognito
      const enableCommand = new AdminEnableUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });
      await cognito.send(enableCommand);

      // 2. Update user attributes to mark as active
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

      // 3. Add user to appropriate groups
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: "Approved-Users",
      });
      await cognito.send(addToGroupCommand);

      // 4. Create audit log entry for approval
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

      // 5. Update user status in DynamoDB
      await updateUserStatus(email, "active", adminEmail);

      // 6. Send approval email
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

      // Update user status in DynamoDB, passing the reason
      await updateUserStatus(email, "rejected", adminEmail, reason);

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

      // Update user status in DynamoDB, passing the reason
      await updateUserStatus(email, "suspended", adminEmail, reason);

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

      // First, check the current status of the user
      let currentStatus = "";
      try {
        const getUserStatusCommand = new GetItemCommand({
          TableName:
            process.env.USER_STATUS_TABLE_NAME ||
            "UserStatus-fk4antj52jgh3j6qjhbhwur5qa-NONE",
          Key: marshall({ id: email }),
        });

        const userStatusResponse = await dynamodb.send(getUserStatusCommand);
        if (userStatusResponse.Item) {
          const userStatus = unmarshall(userStatusResponse.Item) as UserStatus;
          currentStatus = userStatus.status;
          console.log(
            `Current status for ${email} before reactivation: ${currentStatus}`,
          );
        }
      } catch (error) {
        console.warn(`Unable to get current status for ${email}:`, error);
      }

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

      // Update user status in DynamoDB
      // Update user status in DynamoDB (no reason needed for reactivation)
      await updateUserStatus(email, "active", adminEmail);

      // Create audit log entry for reactivation with enhanced details
      const auditLogEntry = {
        timestamp: new Date().toISOString(),
        action: "USER_REACTIVATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email, // Use email directly as resourceId
        details: {
          email: email,
          previousStatus: currentStatus,
          newStatus: "active",
          reactivatedAt: new Date().toISOString(),
        },
      };

      console.log(
        "Creating reactivation audit log:",
        JSON.stringify(auditLogEntry),
      );
      const logId = await createAuditLogEntry(auditLogEntry);
      console.log(`Created audit log for reactivation with ID: ${logId}`);

      if (!logId) {
        console.error("Failed to create audit log for reactivation event");
      }

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
    firstName?: string, // Add firstName parameter
    lastName?: string, // Add lastName parameter
    companyName?: string, // Add companyName parameter
  ): Promise<{ success: boolean; user?: any; error?: string }> => {
    try {
      const userPoolId = getUserPoolId();

      // Log which user pool ID is being used for debugging
      console.log("Creating user with user pool ID:", userPoolId);
      console.log(
        `Creating user ${email} with role ${role} by admin: ${performedBy}`,
        `Profile: ${firstName} ${lastName} @ ${companyName}`, // Log profile info
      );

      if (!userPoolId || !cognito) {
        throw new Error("Missing UserPoolId or Cognito client not initialized");
      }

      // Use our secure password generator
      const tempPassword = generateSecurePassword();

      // Prepare user attributes, including profile info if provided
      const userAttributes: AttributeType[] = [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "custom:role", Value: role },
        { Name: "custom:status", Value: "PENDING" },
      ];

      // Attempt to add both standard and custom attributes for names
      if (firstName) {
        userAttributes.push({ Name: "given_name", Value: firstName });
        userAttributes.push({ Name: "custom:firstName", Value: firstName });
      }
      if (lastName) {
        userAttributes.push({ Name: "family_name", Value: lastName });
        userAttributes.push({ Name: "custom:lastName", Value: lastName });
      }
      if (companyName) {
        userAttributes.push({ Name: "custom:companyName", Value: companyName });
      }

      // Create user in Cognito
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: userAttributes, // Use the constructed array
        TemporaryPassword: tempPassword,
        // Set message action based on shouldSendEmail flag
        MessageAction: shouldSendEmail
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

      // Create UserStatus entry in DynamoDB
      const userStatusItem: UserStatus = {
        id: email,
        email,
        status: "pending",
        role: role === "admin" ? "admin" : "user",
        registrationDate: new Date().toISOString(), // Use current time for registration
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: performedBy || "system",
      };

      console.log(
        "About to write UserStatus with data:",
        JSON.stringify(userStatusItem),
      );
      try {
        const putUserStatus = new PutItemCommand({
          TableName:
            process.env.USER_STATUS_TABLE_NAME ||
            "UserStatus-fk4antj52jgh3j6qjhbhwur5qa-NONE",
          Item: marshall(userStatusItem, { removeUndefinedValues: true }),
        });

        await dynamodb.send(putUserStatus);
        console.log(`SUCCESS: UserStatus record created for ${email}`);
      } catch (error) {
        console.error(`ERROR creating UserStatus for ${email}:`, error);
        throw error; // Re-throw to be caught by the outer try/catch
      }

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
          firstName, // Include profile info in audit log
          lastName,
          companyName,
        },
      });

      if (shouldSendEmail) {
        console.log(
          "createUser: shouldSendEmail is true, about to call sendEmail function",
        );
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

      // Get current role to log in the audit entry
      let currentRole = "user";
      try {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: email,
        });
        const userData = await cognito.send(getUserCommand);
        if (userData.UserAttributes) {
          const roleAttr = userData.UserAttributes.find(
            (attr) => attr.Name === "custom:role",
          );
          if (roleAttr && roleAttr.Value) {
            currentRole = roleAttr.Value;
          }
        }
      } catch (error) {
        console.warn(`Error fetching current role for ${email}:`, error);
      }

      // Log the role change direction to help debug
      const isPromoting = currentRole === "user" && role === "admin";
      const isDemoting = currentRole === "admin" && role === "user";
      console.log(
        `Role change direction: ${isPromoting ? "PROMOTION to admin" : isDemoting ? "DEMOTION to user" : "OTHER"}`,
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

      // Sync status in DynamoDB
      await updateUserStatus(email, "active", adminEmail);

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

      // Create audit log entry for role update with more details
      const auditLogEntry = {
        timestamp: new Date().toISOString(),
        action: "USER_ROLE_UPDATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email: email,
          newRole: role,
          previousRole: currentRole,
          updatedAt: new Date().toISOString(),
          changeDirection: isPromoting
            ? "promotion"
            : isDemoting
              ? "demotion"
              : "unchanged",
          changeDescription: `Changed role from ${currentRole} to ${role}`,
        },
      };

      console.log(
        "Creating role update audit log:",
        JSON.stringify(auditLogEntry),
      );
      const logId = await createAuditLogEntry(auditLogEntry);
      console.log(`Created audit log for role update with ID: ${logId}`);

      return true;
    } catch (error) {
      console.error(`Error updating role for ${email}:`, error);
      return false;
    }
  },

  // New function to update user profile attributes
  updateUserProfile: async (
    email: string,
    firstName?: string,
    lastName?: string,
    companyName?: string,
    adminEmail: string = "admin@example.com",
  ): Promise<boolean> => {
    try {
      const userPoolId = getUserPoolId();
      if (!userPoolId || !cognito) {
        throw new Error("Missing UserPoolId or Cognito client not initialized");
      }

      console.log(
        `Updating profile for user ${email} by admin: ${adminEmail}`,
        `Data: ${firstName} ${lastName} @ ${companyName}`,
      );

      // Prepare attributes to update
      const attributesToUpdate: AttributeType[] = [];
      if (firstName !== undefined) {
        attributesToUpdate.push({ Name: "custom:firstName", Value: firstName });
        attributesToUpdate.push({ Name: "given_name", Value: firstName }); // Also update standard attribute
      }
      if (lastName !== undefined) {
        attributesToUpdate.push({ Name: "custom:lastName", Value: lastName });
        attributesToUpdate.push({ Name: "family_name", Value: lastName }); // Also update standard attribute
      }
      if (companyName !== undefined) {
        attributesToUpdate.push({
          Name: "custom:companyName",
          Value: companyName,
        });
      }

      // Only proceed if there are attributes to update
      if (attributesToUpdate.length === 0) {
        console.log("No profile attributes provided to update.");
        return true; // Nothing to do, consider it a success
      }

      // Update attributes in Cognito
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: attributesToUpdate,
      });
      await cognito.send(updateAttributesCommand);
      console.log(`User profile attributes updated for ${email}`);

      // Create audit log entry for profile update
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_PROFILE_UPDATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email: email,
          updatedFields: attributesToUpdate.map((attr) => attr.Name),
          updatedAt: new Date().toISOString(),
        },
      });

      return true;
    } catch (error) {
      console.error(`Error updating profile for ${email}:`, error);
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
        const tableName =
          process.env.USER_STATUS_TABLE_NAME ||
          "UserStatus-fk4antj52jgh3j6qjhbhwur5qa-NONE";
        const scanCommand = new ScanCommand({
          TableName: tableName,
          ConsistentRead: true,
        });

        const response = await dynamodb.send(scanCommand);
        const users = response.Items
          ? response.Items.map((item) => unmarshall(item) as UserStatus)
          : [];
        console.log(`Fetched ${users.length} users from DynamoDB`);

        if (users.length > 0) {
          stats.users.total = users.length;
          users.forEach((user) => {
            switch (user.status) {
              case "active":
                stats.users.active++;
                break;
              case "pending":
                stats.users.pending++;
                break;
              case "rejected":
                stats.users.rejected++;
                break;
              case "suspended":
                stats.users.suspended++;
                break;
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
          TableName:
            process.env.AUDIT_LOG_TABLE_NAME ||
            "AuditLog-fk4antj52jgh3j6qjhbhwur5qa-NONE",
          // Increase limit to ensure we get more events (maximum allowed in a single scan)
          Limit: 1000,
        });

        const auditResponse = await dynamodb.send(scanCommand);
        if (auditResponse.Items) {
          // Map items and explicitly convert timestamp strings to Date objects for sorting
          const auditLogs = auditResponse.Items.map((item) => {
            const log = unmarshall(item) as AuditLog;
            // Ensure timestamp is in correct format
            if (!log.timestamp) {
              log.timestamp = new Date().toISOString();
            }

            // Make sure resourceId and affectedResource are consistently formatted
            // This helps the UI properly display the activity details
            if (
              log.affectedResource === "user" &&
              !log.resourceId &&
              log.details?.email
            ) {
              log.resourceId = log.details.email as string;
            }

            return log;
          });

          // Add detailed logging to help diagnose issues
          console.log(`Raw audit logs count: ${auditLogs.length}`);
          console.log(
            `Audit log actions: ${auditLogs.map((log) => log.action).join(", ")}`,
          );

          // Show some sample logs
          if (auditLogs.length > 0) {
            const sampleLogs = auditLogs.slice(0, 3);
            console.log(
              "Sample audit logs:",
              JSON.stringify(sampleLogs, null, 2),
            );
          }

          // Sort by timestamp, newest first - ensure proper comparison of dates
          auditLogs.sort((a, b) => {
            // Parse ISO strings to timestamps for comparison
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();

            // Compare by timestamp, newest first
            const timeComparison = dateB - dateA;

            // If timestamps are identical, use ID as a tiebreaker to ensure consistent order
            if (timeComparison === 0 && a.id && b.id) {
              return a.id.localeCompare(b.id);
            }

            return timeComparison;
          });

          // Take more activities (increase to 100) - this should include all activities for test users
          stats.recentActivity = auditLogs.slice(0, 100);

          console.log(
            `Returning ${stats.recentActivity.length} recent activities`,
          );
          console.log(
            "First 3 activities:",
            stats.recentActivity
              .slice(0, 3)
              .map(
                (a) =>
                  `${a.action} - ${a.timestamp} - ${a.affectedResource}/${a.resourceId || "no-id"}`,
              ),
          );
        }
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
      const tableName = process.env.AUDIT_LOG_TABLE_NAME || "AuditLog";
      const indexName = "performedByIndex";
      const dynamodb = getDynamoDBClient();

      // Ensure performedBy is provided (required for GSI query)
      if (!filters?.performedBy) {
        throw new Error("performedBy filter is required to query by GSI.");
      }
      const performedBy = filters.performedBy;

      // Set default date range to last 30 days
      const startDate = dateRange?.startDate
        ? new Date(dateRange.startDate).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const endDate = dateRange?.endDate
        ? new Date(dateRange.endDate).toISOString()
        : new Date().toISOString();

      const queryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression:
          "performedBy = :performedBy AND #ts BETWEEN :start AND :end",
        ExpressionAttributeNames: {
          "#ts": "timestamp",
        },
        ExpressionAttributeValues: {
          ":performedBy": { S: performedBy },
          ":start": { S: startDate },
          ":end": { S: endDate },
        },
      });

      const response = await dynamodb.send(queryCommand);

      let logs = (response.Items || []).map((item) =>
        unmarshall(item),
      ) as AuditLog[];

      // Optional post-filtering
      if (filters?.action) {
        logs = logs.filter((log) => log.action.includes(filters.action!));
      }

      if (filters?.affectedResource) {
        logs = logs.filter((log) =>
          log.affectedResource.includes(filters.affectedResource!),
        );
      }

      // Sort by timestamp descending
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
          const item = marshall(setting, { removeUndefinedValues: true });

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

      // Step 1: Update user status in DynamoDB to "deleted" with TTL (30 days from now)
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60; // 30 days in seconds
      const ttl = Math.floor(Date.now() / 1000) + thirtyDaysInSeconds; // Current time + 30 days in Unix timestamp
      await updateUserStatus(email, "deleted", adminEmail, undefined, ttl); // Pass undefined for reason

      // Step 2: Create audit log entry for the deletion AFTER updating status
      const auditLogEntry = {
        timestamp: new Date().toISOString(),
        action: "USER_DELETED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email, // Ensure consistent use of email as resourceId
        details: {
          email: email,
          deletedAt: new Date().toISOString(),
          userId: userId, // Store the internal user ID in details
          deletedBy: adminEmail,
        },
      };

      console.log(
        "Creating deletion audit log:",
        JSON.stringify(auditLogEntry),
      );
      const logId = await createAuditLogEntry(auditLogEntry);
      console.log(`Created audit log for user deletion with ID: ${logId}`);

      // Ensure the audit log entry is properly created before proceeding
      if (!logId) {
        console.error("Failed to create audit log for user deletion");
      }

      // Step 3: Delete user's assessments
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
            ExpressionAttributeValues: marshall(
              {
                ":owner": userId,
              },
              { removeUndefinedValues: true },
            ),
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
              // This would depend on our S3 bucket structure
            }
          }
        }

        // Similar process for completed assessments
        const completedAssessmentTableName =
          process.env.API_GRCSITE2_COMPLETEDASSESSMENTTABLE_NAME;
        if (completedAssessmentTableName) {
          const completedScanCommand = new ScanCommand({
            TableName: completedAssessmentTableName,
            FilterExpression: "owner = :owner",
            ExpressionAttributeValues: marshall(
              {
                ":owner": userId,
              },
              { removeUndefinedValues: true },
            ),
          });

          const completedAssessments =
            await dynamodb.send(completedScanCommand);
          console.log(
            `Found ${completedAssessments.Items?.length || 0} completed assessments for user`,
          );

          // Delete each assessment
          if (
            completedAssessments.Items &&
            completedAssessments.Items.length > 0
          ) {
            for (const item of completedAssessments.Items) {
              const deleteParams = {
                TableName: completedAssessmentTableName,
                Key: {
                  id: item.id,
                },
              };

              // Create audit log for assessment deletion
              await createAuditLogEntry({
                timestamp: new Date().toISOString(),
                action: "ASSESSMENT_DELETED",
                performedBy: adminEmail,
                affectedResource: "assessment",
                resourceId: item.id.S,
                details: {
                  assessmentName: item.name?.S || "Unknown",
                  status: "completed",
                  reason: "User account deletion",
                  deletedAt: new Date().toISOString(),
                },
              });

              // We would also need to delete associated files from S3 here
              // This would depend on your S3 bucket structure
            }
          }
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

  migrateUsersToDynamoDB: async (): Promise<string> => {
    try {
      // Get all users from Cognito
      console.log("Starting migration: fetching users from Cognito");
      const users = await fetchUsersFromCognito();
      console.log(`Found ${users.length} users in Cognito`);

      let migratedCount = 0;
      let failures = [];

      for (const user of users) {
        const email = user.email || "";
        if (!email) {
          console.log("Skipping user with no email");
          continue;
        }

        console.log(`Processing user: ${email}`);

        // Determine status
        let status: UserStatus["status"] = "pending";
        if (user.attributes?.["custom:status"] === "REJECTED") {
          status = "rejected";
        } else if (user.attributes?.["custom:status"] === "SUSPENDED") {
          status = "suspended";
        } else if (user.status === "CONFIRMED" && user.enabled) {
          status = "active";
        }

        // Determine role
        const role =
          user.attributes?.["custom:role"] === "admin" ? "admin" : "user";

        // Create UserStatus entry with detailed logging
        console.log(
          `Creating UserStatus for ${email} with status: ${status}, role: ${role}`,
        );

        try {
          // Create/Update UserStatus entry (no reason for migration)
          await updateUserStatus(email, status, "system-migration");

          // Update role if needed (this PutItem might be redundant if updateUserStatus handles role)
          // Consider refactoring updateUserStatus to handle role updates as well
          await dynamodb.send(
            new PutItemCommand({
              TableName:
                process.env.USER_STATUS_TABLE_NAME ||
                "UserStatus-fk4antj52jgh3j6qjhbhwur5qa-NONE",
              Item: marshall(
                {
                  id: email,
                  email,
                  status,
                  role,
                  registrationDate:
                    user.created?.toISOString() || new Date().toISOString(),
                  lastStatusChange: new Date().toISOString(),
                  lastStatusChangeBy: "system-migration",
                },
                { removeUndefinedValues: true },
              ),
            }),
          );

          console.log(`Successfully added ${email} to DynamoDB`);
          migratedCount++;
        } catch (error) {
          console.error(`Failed to migrate user ${email}:`, error);
          failures.push({ email, error: String(error) });
        }
      }

      return JSON.stringify({
        success: true,
        migratedCount,
        totalUsers: users.length,
        failures: failures.length > 0 ? failures : undefined,
      });
    } catch (error) {
      console.error("Error migrating users:", error);
      return JSON.stringify({ success: false, error: String(error) });
    }
  },
};

console.log("Environment variables:", {
  completedTable: process.env.COMPLETED_ASSESSMENT_TABLE_NAME,
  inProgressTable: process.env.IN_PROGRESS_ASSESSMENT_TABLE_NAME,
});
