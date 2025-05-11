// File: amplify/functions/user-management/src/userOperations.ts
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  MessageActionType, // Import MessageActionType
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
  DeleteItemCommand,
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

// --- Client Initialization ---
// (Keep existing client initialization code)
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

const getDynamoDBClient = () => {
  try {
    return new DynamoDBClient();
  } catch (error) {
    console.error("Error creating DynamoDB client:", error);
    throw error;
  }
};

let cognito: CognitoIdentityProviderClient;
let ses: SESClient;
let dynamodb: DynamoDBClient;

try {
  cognito = getCognitoClient();
  ses = getSesClient();
  dynamodb = getDynamoDBClient();
  //console.log("AWS clients initialized successfully");
} catch (error) {
  console.error("Error initializing AWS clients:", error);
}

// --- Interfaces ---
interface EmailOptions {
  to: string;
  subject: string;
  message: string;
}

interface CognitoUserData {
  email: string | undefined;
  status: string | undefined;
  enabled: boolean | undefined;
  created: Date | undefined;
  lastModified: Date | undefined;
  attributes?: Record<string, string>;
}

interface UserStatus {
  id: string; // email
  email: string;
  status: "pending" | "active" | "suspended" | "rejected" | "deleted";
  role: "user" | "admin";
  firstName?: string;
  lastName?: string;
  companyName?: string;
  registrationDate?: string;
  lastLogin?: string;
  notes?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  approvedBy?: string;
  lastStatusChange?: string;
  lastStatusChangeBy?: string;
  ttl?: number;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  affectedResource: string;
  resourceId?: string;
  details?: Record<string, any>;
}

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

// --- Helper Functions ---
const getUserPoolId = (): string => {
  const userPoolId = env.USER_POOL_ID || process.env.USER_POOL_ID;
  if (!userPoolId)
    throw new Error("USER_POOL_ID environment variable is not set.");
  //console.log(`[Debug] Using UserPoolId: ${userPoolId}`);
  return userPoolId;
};

const getUserStatusTableName = (): string => {
  const tableName =
    env.USER_STATUS_TABLE_NAME || process.env.USER_STATUS_TABLE_NAME;
  if (!tableName)
    throw new Error("USER_STATUS_TABLE_NAME environment variable is not set.");
  //console.log(`[Debug] Using UserStatus Table: ${tableName}`);
  return tableName;
};

const getAuditLogTableName = (): string => {
  const tableName =
    env.AUDIT_LOG_TABLE_NAME || process.env.AUDIT_LOG_TABLE_NAME;
  if (!tableName)
    throw new Error("AUDIT_LOG_TABLE_NAME environment variable is not set.");
  //console.log(`[Debug] Using AuditLog Table: ${tableName}`);
  return tableName;
};

const getSystemSettingsTableName = (): string => {
  const tableName =
    env.SYSTEM_SETTINGS_TABLE_NAME || process.env.SYSTEM_SETTINGS_TABLE_NAME;
  if (!tableName)
    throw new Error(
      "SYSTEM_SETTINGS_TABLE_NAME environment variable is not set.",
    );
  //console.log(`[Debug] Using SystemSettings Table: ${tableName}`);
  return tableName;
};

const getCompletedAssessmentTableName = (): string => {
  const tableName =
    env.COMPLETED_ASSESSMENT_TABLE_NAME ||
    process.env.COMPLETED_ASSESSMENT_TABLE_NAME;
  if (!tableName)
    throw new Error(
      "COMPLETED_ASSESSMENT_TABLE_NAME environment variable is not set.",
    );
  //console.log(`[Debug] Using CompletedAssessment Table: ${tableName}`);
  return tableName;
};

const getInProgressAssessmentTableName = (): string => {
  const tableName =
    env.IN_PROGRESS_ASSESSMENT_TABLE_NAME ||
    process.env.IN_PROGRESS_ASSESSMENT_TABLE_NAME;
  if (!tableName)
    throw new Error(
      "IN_PROGRESS_ASSESSMENT_TABLE_NAME environment variable is not set.",
    );
  //console.log(`[Debug] Using InProgressAssessment Table: ${tableName}`);
  return tableName;
};

// --- Log resolved configuration ---
//console.log(
//  `[UserManagementConfig] Running in Lambda function: ${process.env.AWS_LAMBDA_FUNCTION_NAME}`,
//);
try {
  // Call helper functions to log resolved names
  const poolId = getUserPoolId(); // Call once
  const userStatusTable = getUserStatusTableName(); // Call once
  const auditTable = getAuditLogTableName(); // Call once
  const completedTable = getCompletedAssessmentTableName(); // Call once
  const inProgressTable = getInProgressAssessmentTableName(); // Call once
  const settingsTable = getSystemSettingsTableName(); // Call once

  //console.log(`[UserManagementConfig] Resolved User Pool ID: ${poolId}`);
  //console.log(
  //  `[UserManagementConfig] Resolved UserStatus Table: ${userStatusTable}`,
  //);
  //console.log(`[UserManagementConfig] Resolved AuditLog Table: ${auditTable}`);
  //console.log(
  //  `[UserManagementConfig] Resolved CompletedAssessment Table: ${completedTable}`,
  //);
  //console.log(
  //  `[UserManagementConfig] Resolved InProgressAssessment Table: ${inProgressTable}`,
  //);
  //console.log(
  //  `[UserManagementConfig] Resolved SystemSettings Table: ${settingsTable}`,
  //);
  //console.log(
  //  `[UserManagementConfig] Resolved EMAIL_SENDER: ${env.EMAIL_SENDER || process.env.EMAIL_SENDER || "Default Used"}`,
  //);
} catch (e) {
  console.error(
    "[UserManagementConfig] Error resolving resource names during logging:",
    e,
  );
}
// ---------------------------------------------------------------------------------------

const sendEmailHelper = async ({
  to,
  subject,
  message,
}: EmailOptions): Promise<boolean> => {
  // Renamed internal helper to avoid conflict with exported name
  try {
    if (!ses) throw new Error("SES client not initialized");
    const command = new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Body: { Html: { Charset: "UTF-8", Data: message } },
        Subject: { Charset: "UTF-8", Data: subject },
      },
      Source:
        env.EMAIL_SENDER ||
        process.env.EMAIL_SENDER ||
        "no-reply-grc@mc3technologies.com", // Fallback
    });
    await ses.send(command);
    //console.log(`Email sent successfully to ${to} with subject "${subject}"`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
};
export { sendEmailHelper as sendEmail }; // Export the helper with the original name

const generateSecurePassword = (): string => {
  // (Keep existing password generation logic)
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+{}:\"<>?|[];',./`~";
  let password =
    uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length)) +
    lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length)) +
    numbers.charAt(Math.floor(Math.random() * numbers.length)) +
    specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  const allChars = uppercaseChars + lowercaseChars + numbers + specialChars;
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

const createAuditLogEntry = async (logEntry: Omit<AuditLog, "id">) => {
  // (Keep existing audit log creation logic)
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const completeLogEntry: AuditLog = { id, ...logEntry };
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
    const item = marshall(completeLogEntry, { removeUndefinedValues: true });
    const command = new PutItemCommand({
      TableName: getAuditLogTableName(),
      Item: item,
    });
    await dynamodb.send(command);
    //console.log(`Audit log created with ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Error creating audit log entry:", error);
    return null;
  }
};

// --- User Operations ---
export const userOperations = {
  // List all users (Source: Cognito, Enriched with DynamoDB status)
  listUsers: async (): Promise<string> => {
    try {
      const userPoolId = getUserPoolId();
      const cognito = getCognitoClient();
      const dynamodb = getDynamoDBClient();
      const userStatusTableName = getUserStatusTableName();
      //console.log(
      //  `[listUsers] Fetching users from Cognito pool: ${userPoolId}`,
      //);

      let allCognitoUsers: UserType[] = [];
      let paginationToken: string | undefined = undefined;

      // Paginate through all Cognito users
      do {
        const listCommand = new ListUsersCommand({
          UserPoolId: userPoolId,
          Limit: 60, // Process in batches
          PaginationToken: paginationToken,
        });
        const response: import("@aws-sdk/client-cognito-identity-provider").ListUsersCommandOutput =
          await cognito.send(listCommand);
        allCognitoUsers = allCognitoUsers.concat(response.Users || []);
        paginationToken = response.PaginationToken;
      } while (paginationToken);

      //console.log(
      //  `[listUsers] Fetched ${allCognitoUsers.length} users from Cognito. Enriching with DynamoDB status from table: ${userStatusTableName}`,
      //);

      const enrichedUsers = await Promise.all(
        allCognitoUsers.map(async (cognitoUser) => {
          const attributes: Record<string, string> = {};
          cognitoUser.Attributes?.forEach((attr) => {
            if (attr.Name && attr.Value) attributes[attr.Name] = attr.Value;
          });
          const email = attributes["email"] || cognitoUser.Username; // Prefer email attribute, fallback to Username

          let dbStatus: UserStatus["status"] | undefined;
          let dbRole: UserStatus["role"] | undefined;
          let dbFirstName: string | undefined;
          let dbLastName: string | undefined;
          let dbCompanyName: string | undefined;
          let registrationDate: string | undefined =
            cognitoUser.UserCreateDate?.toISOString(); // Default to Cognito creation date
          let lastStatusChange: string | undefined =
            cognitoUser.UserLastModifiedDate?.toISOString(); // Default to Cognito modified date

          if (email) {
            // Only query DynamoDB if we have an email
            try {
              const dbResponse = await dynamodb.send(
                new GetItemCommand({
                  TableName: userStatusTableName,
                  Key: marshall({ id: email }),
                }),
              );
              if (dbResponse.Item) {
                const dbUser = unmarshall(
                  dbResponse.Item,
                ) as Partial<UserStatus>;
                dbStatus = dbUser.status;
                dbRole = dbUser.role;
                dbFirstName = dbUser.firstName; // Prefer DynamoDB profile data if available
                dbLastName = dbUser.lastName;
                dbCompanyName = dbUser.companyName;
                if (dbUser.registrationDate)
                  registrationDate = dbUser.registrationDate;
                if (dbUser.lastStatusChange)
                  lastStatusChange = dbUser.lastStatusChange;
              }
            } catch (err) {
              // Log if DynamoDB query fails, but don't block the process
              console.warn(
                `[listUsers] Could not fetch DynamoDB UserStatus for ${email}: ${(err as Error).message}`,
              );
            }
          }

          // Determine final values, prioritizing Cognito then DynamoDB for profile, but DynamoDB for status/role
          const finalFirstName =
            attributes["given_name"] ||
            attributes["custom:firstName"] ||
            dbFirstName;
          const finalLastName =
            attributes["family_name"] ||
            attributes["custom:lastName"] ||
            dbLastName;
          const finalCompanyName =
            attributes["custom:companyName"] || dbCompanyName;
          const finalStatus =
            dbStatus || (cognitoUser.Enabled ? "active" : "pending"); // Fallback status based on Cognito enabled state
          const finalRole =
            dbRole ||
            (attributes["custom:role"] as UserStatus["role"]) ||
            "user"; // Fallback role

          return {
            email: email || "N/A", // Ensure email is always present
            status: finalStatus,
            role: finalRole,
            created: registrationDate,
            lastModified: lastStatusChange,
            enabled: cognitoUser.Enabled,
            firstName: finalFirstName,
            lastName: finalLastName,
            companyName: finalCompanyName,
            cognitoStatus: cognitoUser.UserStatus, // Include Cognito status for reference
            id: attributes["sub"], // Add the Cognito sub as a top-level 'id'
            attributes: attributes, // Include the full attributes map from Cognito
          };
        }),
      );
      //console.log(`[listUsers] Finished enriching users.`);
      return JSON.stringify(enrichedUsers);
    } catch (error) {
      console.error("[listUsers] Error listing users:", error);
      return JSON.stringify({ users: [], error: (error as Error).message });
    }
  },

  // Get all users from UserStatus table
  getAllUsers: async (): Promise<string> => {
    try {
      const tableName = getUserStatusTableName();
      const dynamodb = getDynamoDBClient();
      console.log(`Scanning DynamoDB UserStatus table for all users`);

      const scanCommand = new ScanCommand({
        TableName: tableName,
      });
      const response = await dynamodb.send(scanCommand);

      const users = (response.Items || []).map((item) => {
        const parsed = unmarshall(item) as UserStatus;
        return {
          email: parsed.email,
          status: parsed.status,
          role: parsed.role || "user",
          created: parsed.registrationDate,
          lastModified: parsed.lastStatusChange,
          enabled:
            parsed.status !== "suspended" && parsed.status !== "rejected",
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          companyName: parsed.companyName,
        };
      });
      console.log(
        `Found ${users.length} total users in DynamoDB UserStatus table`,
      );
      return JSON.stringify(users);
    } catch (error) {
      console.error(`Error in getAllUsers:`, error);
      return JSON.stringify({
        error: `Failed to retrieve all users`,
      });
    }
  },

  // Get users by status (Uses DynamoDB UserStatus table GSI)
  getUsersByStatus: async (status: string): Promise<string> => {
    // (Keep reverted logic using DynamoDB GSI)
    try {
      const tableName = getUserStatusTableName();
      const indexName = "status-index";
      const dynamodb = getDynamoDBClient();
      if (!status) throw new Error("Status parameter is required.");

      const requestedStatus = status.toLowerCase() as UserStatus["status"];
      //console.log(
      //  `Querying DynamoDB UserStatus table for status: ${requestedStatus}`,
      //);

      const queryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: "#status = :statusVal",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":statusVal": { S: requestedStatus } },
      });
      const response = await dynamodb.send(queryCommand);

      const users = (response.Items || []).map((item) => {
        const parsed = unmarshall(item) as UserStatus;
        return {
          email: parsed.email,
          status: parsed.status,
          role: parsed.role || "user",
          created: parsed.registrationDate,
          lastModified: parsed.lastStatusChange,
          enabled:
            parsed.status !== "suspended" && parsed.status !== "rejected",
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          companyName: parsed.companyName,
        };
      });
      //console.log(
      //  `Found ${users.length} users in DynamoDB with status: ${requestedStatus}`,
      //);
      return JSON.stringify(users);
    } catch (error) {
      console.error(`Error in getUsersByStatus (${status}):`, error);
      return JSON.stringify({
        error: `Failed to retrieve users by status: ${status}`,
      });
    }
  },

  // Get user details (Enriched with DynamoDB)
  getUserDetails: async (email: string): Promise<string> => {
    // (Keep existing getUserDetails logic)
    try {
      const userPoolId = getUserPoolId();
      const command = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });
      const response = await cognito.send(command);
      const attributes: Record<string, string> = {};
      response.UserAttributes?.forEach((attr) => {
        if (attr.Name && attr.Value) attributes[attr.Name] = attr.Value;
      });

      let dbUser: Partial<UserStatus> = {};
      try {
        const dbResponse = await dynamodb.send(
          new GetItemCommand({
            TableName: getUserStatusTableName(),
            Key: marshall({ id: email }),
          }),
        );
        if (dbResponse.Item)
          dbUser = unmarshall(dbResponse.Item) as Partial<UserStatus>;
      } catch (err) {
        console.warn(
          `No DynamoDB UserStatus record found for ${email} in getUserDetails`,
        );
      }

      const userDetails = {
        email,
        cognitoStatus: response.UserStatus,
        enabled: response.Enabled,
        created: response.UserCreateDate?.toISOString(),
        lastModified: response.UserLastModifiedDate?.toISOString(),
        attributes,
        status: dbUser.status || "pending",
        role: dbUser.role || attributes["custom:role"] || "user",
        firstName: dbUser.firstName || attributes["given_name"],
        lastName: dbUser.lastName || attributes["family_name"],
        companyName: dbUser.companyName || attributes["custom:companyName"],
        registrationDate: dbUser.registrationDate,
        lastStatusChange: dbUser.lastStatusChange,
      };
      return JSON.stringify(userDetails);
    } catch (error) {
      console.error(`Error getting user details for ${email}:`, error);
      return JSON.stringify({ error: `Failed to get details for ${email}` });
    }
  },

  // Get user profile
  getUserProfile: async (email: string): Promise<string> => {
    try {
      console.log(`Getting profile for user: ${email}`);
      
      // First try to get data from the UserStatus table
      const userStatusTableName = process.env.USER_STATUS_TABLE_NAME;
      
      if (!userStatusTableName) {
        throw new Error("USER_STATUS_TABLE_NAME environment variable is not set");
      }
      
      const dynamoDb = new DynamoDBClient();
      
      // First check if user exists in the UserStatus table using id as the key
      let getItemCommand = new GetItemCommand({
        TableName: userStatusTableName,
        Key: { id: { S: email } },
      });
      
      let result = await dynamoDb.send(getItemCommand);
      
      // If not found by id, try using email as the key
      if (!result.Item) {
        console.log(`User not found with id=${email}, trying with email=${email}`);
        getItemCommand = new GetItemCommand({
          TableName: userStatusTableName,
          Key: { email: { S: email } },
        });
        
        result = await dynamoDb.send(getItemCommand);
      }
      
      if (result.Item) {
        // User exists in UserStatus table, parse and return the profile data
        const userStatus = unmarshall(result.Item) as any;
        console.log("Found user in DynamoDB:", userStatus);
        
        const profileData = {
          firstName: userStatus.firstName || "",
          lastName: userStatus.lastName || "",
          companyName: userStatus.companyName || "",
          lastStatusChange: userStatus.lastStatusChange || "",
          lastStatusChangeBy: userStatus.lastStatusChangeBy || "",
          status: userStatus.status || "",
          role: userStatus.role || ""
        };
        
        console.log("Returning profile data:", profileData);
        return JSON.stringify(profileData);
      } else {
        // User not found in UserStatus table, try to get from Cognito
        // This is a fallback in case the user exists in Cognito but not in DynamoDB yet
        try {
          // Get user from Cognito using admin APIs
          const cognitoIdp = new CognitoIdentityProviderClient();
          const userPoolId = process.env.USER_POOL_ID;
          
          if (!userPoolId) {
            throw new Error("USER_POOL_ID environment variable is not set");
          }
          
          const listUsersCommand = new ListUsersCommand({
            UserPoolId: userPoolId,
            Filter: `email = "${email}"`,
            Limit: 1,
          });
          
          const listUsersResult = await cognitoIdp.send(listUsersCommand);
          const cognitoUser = listUsersResult.Users?.[0];
          
          if (cognitoUser) {
            // Parse attributes to find profile information
            const attributes = cognitoUser.Attributes || [];
            
            const profileData = {
              firstName: attributes.find((attr: { Name?: string }) => attr.Name === "given_name")?.Value || "",
              lastName: attributes.find((attr: { Name?: string }) => attr.Name === "family_name")?.Value || "",
              companyName: attributes.find((attr: { Name?: string }) => attr.Name === "custom:company")?.Value || "",
            };
            
            return JSON.stringify(profileData);
          }
        } catch (error) {
          console.error("Error getting user from Cognito:", error);
        }
        
        // Return empty profile if user not found anywhere
        return JSON.stringify({
          firstName: "",
          lastName: "",
          companyName: "",
        });
      }
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return JSON.stringify({
        firstName: "",
        lastName: "",
        companyName: "",
      });
    }
  },

  // Approve user
  approveUser: async (
    email: string,
    adminEmail: string = "system",
  ): Promise<boolean> => {
    // (Keep existing approveUser logic - already updated)
    try {
      const userPoolId = getUserPoolId();
      //console.log(`Approving user ${email} by admin: ${adminEmail}`);
      await cognito.send(
        new AdminEnableUserCommand({ UserPoolId: userPoolId, Username: email }),
      );
      await cognito.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: email,
          UserAttributes: [{ Name: "custom:status", Value: "ACTIVE" }],
        }),
      );
      await cognito.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: email,
          GroupName: "Approved-Users",
        }),
      );

      let profileData: {
        firstName?: string;
        lastName?: string;
        companyName?: string;
        role?: string;
      } = {}; // Add role here
      let fetchedAttributes: Record<string, string | undefined> = {}; // To log what we got from Cognito

      try {
        const userDetailsResponse = await cognito.send(
          new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email }),
        );
        if (userDetailsResponse.UserAttributes) {
          // Log raw attributes fetched
          //console.log(
          //  `[approveUser] Fetched attributes from Cognito for ${email}:`,
          //  JSON.stringify(userDetailsResponse.UserAttributes),
          //);

          // Store fetched attributes for easier access and logging
          userDetailsResponse.UserAttributes.forEach((attr) => {
            if (attr.Name) {
              fetchedAttributes[attr.Name] = attr.Value;
            }
          });

          // Map Cognito attributes to profileData
          profileData.firstName =
            fetchedAttributes["given_name"] ||
            fetchedAttributes["custom:firstName"]; // Check standard then custom
          profileData.lastName =
            fetchedAttributes["family_name"] ||
            fetchedAttributes["custom:lastName"]; // Check standard then custom
          profileData.companyName = fetchedAttributes["custom:companyName"];
          profileData.role = fetchedAttributes["custom:role"] || "user"; // Get role, default to 'user'

          //console.log(
          //  `[approveUser] Mapped profile data for ${email}:`,
          //  JSON.stringify(profileData),
          //);
        } else {
          //console.warn(
          //  `[approveUser] No UserAttributes found in Cognito response for ${email}.`,
          //);
        }
      } catch (fetchError) {
        //console.warn(
        //  `[approveUser] Could not fetch Cognito profile attributes for ${email} during approval:`,
        //  fetchError,
        //);
      }

      // Fetch the existing DynamoDB record first
      const userStatusTableName = getUserStatusTableName(); // Get table name
      let existingUserStatus: Partial<UserStatus> = {};
      let registrationDateToKeep: string | undefined;

      try {
        //console.log(
        //  `[approveUser] Fetching existing UserStatus record from table: ${userStatusTableName} for user: ${email}`,
        //);
        const getResponse = await dynamodb.send(
          new GetItemCommand({
            TableName: userStatusTableName,
            Key: marshall({ id: email }),
          }),
        );
        if (getResponse.Item) {
          existingUserStatus = unmarshall(getResponse.Item) as UserStatus;
          registrationDateToKeep = existingUserStatus.registrationDate; // Explicitly save registration date
          //console.log(
          //  `[approveUser] Found existing DynamoDB record:`,
          //  JSON.stringify(existingUserStatus),
          //);
        } else {
          //console.log(
          //  `[approveUser] No existing DynamoDB record found for ${email}. Will create new one.`,
          //);
          registrationDateToKeep = new Date().toISOString(); // Use now if creating
        }
      } catch (getError) {
        //console.error(
        //  `[approveUser] Error fetching existing UserStatus record for ${email}:`,
        //  getError,
        //);
        registrationDateToKeep = new Date().toISOString(); // Fallback registration date
      }

      // Prepare data for DynamoDB update, merging carefully
      const userStatusUpdateData: UserStatus = {
        // Required fields
        id: email,
        email: email,
        status: "active", // Set status to active
        role:
          (profileData.role as UserStatus["role"]) ||
          existingUserStatus.role ||
          "user", // Prefer fetched role, then existing, fallback user
        registrationDate: registrationDateToKeep, // Use the preserved/fetched registration date
        lastStatusChange: new Date().toISOString(), // Always update this
        lastStatusChangeBy: adminEmail, // Always update this
        // Optional profile fields: prefer fetched Cognito data, fallback to existing, then undefined
        firstName:
          profileData.firstName || existingUserStatus.firstName || undefined,
        lastName:
          profileData.lastName || existingUserStatus.lastName || undefined,
        companyName:
          profileData.companyName ||
          existingUserStatus.companyName ||
          undefined,
        // Explicitly carry over other existing optional fields if they exist
        lastLogin: existingUserStatus.lastLogin || undefined,
        notes: existingUserStatus.notes || undefined,
        approvedBy: existingUserStatus.approvedBy || undefined, // Should likely set this? Maybe add adminEmail here? Let's keep existing for now.
        // Clear fields that should be cleared on approval
        rejectionReason: undefined,
        suspensionReason: undefined,
        ttl: undefined, // Remove TTL if reactivating/approving
      };

      //console.log(
      //  `[approveUser] Merged data being written to DynamoDB:`,
      //  JSON.stringify(userStatusUpdateData),
      //); // Log the exact data

      // Use PutItemCommand which creates or replaces the item
      await dynamodb.send(
        new PutItemCommand({
          TableName: userStatusTableName,
          Item: marshall(userStatusUpdateData, { removeUndefinedValues: true }), // Restore marshall call
        }),
      );
      //console.log(
      //  `[approveUser] Successfully wrote UserStatus record for ${email} to DynamoDB.`,
      //);

      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_APPROVED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: { email, approvedAt: new Date().toISOString() },
      });
      await sendEmailHelper({
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
    adminEmail: string = "system",
  ): Promise<boolean> => {
    // (Keep existing rejectUser logic)
    try {
      const userPoolId = getUserPoolId();
      console.log(`Rejecting user ${email} by admin: ${adminEmail}`); // Keep console log for debugging
      await cognito.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: email,
          UserAttributes: [{ Name: "custom:status", Value: "REJECTED" }],
        }),
      );

      // Fetch the existing DynamoDB record first
      const userStatusTableName = getUserStatusTableName();
      let existingUserStatus: Partial<UserStatus> = {};
      try {
        const getResponse = await dynamodb.send(
          new GetItemCommand({
            TableName: userStatusTableName,
            Key: marshall({ id: email }),
          }),
        );
        if (getResponse.Item) {
          existingUserStatus = unmarshall(getResponse.Item) as UserStatus;
          console.log(
            `[rejectUser] Found existing DynamoDB record:`,
            JSON.stringify(existingUserStatus),
          );
        } else {
          console.log(
            `[rejectUser] No existing DynamoDB record found for ${email}. Creating new one.`,
          );
        }
      } catch (getError) {
        console.error(
          `[rejectUser] Error fetching existing UserStatus record for ${email}:`,
          getError,
        );
        // Continue even if fetch fails, will create a new record
      }

      // Prepare data for DynamoDB update, merging carefully
      const userStatusUpdateData: UserStatus = {
        // Merge existing data
        ...existingUserStatus,
        // Required fields (overwrite if necessary)
        id: email,
        email: email,
        status: "rejected", // Set status to rejected
        role: existingUserStatus.role || "user", // Preserve role or default
        registrationDate:
          existingUserStatus.registrationDate || new Date().toISOString(), // Preserve registration date
        lastStatusChange: new Date().toISOString(), // Always update this
        lastStatusChangeBy: adminEmail, // Always update this
        rejectionReason: reason, // Add/update rejection reason
        // Preserve other optional fields from existing data
        firstName: existingUserStatus.firstName,
        lastName: existingUserStatus.lastName,
        companyName: existingUserStatus.companyName,
        lastLogin: existingUserStatus.lastLogin,
        notes: existingUserStatus.notes,
        approvedBy: existingUserStatus.approvedBy,
        suspensionReason: existingUserStatus.suspensionReason, // Keep suspension reason if it exists? Or clear? Let's keep it for now.
        ttl: undefined, // Ensure TTL is removed if user was previously marked for deletion
      };

      await dynamodb.send(
        new PutItemCommand({
          TableName: userStatusTableName,
          Item: marshall(userStatusUpdateData, { removeUndefinedValues: true }),
        }),
      );
      console.log(
        `Updated UserStatus for ${email} to rejected with preserved metadata.`,
      ); // Updated log message

      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_REJECTED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          reason: reason || "No reason provided",
          rejectedAt: new Date().toISOString(),
        },
      });
      if (reason)
        await sendEmailHelper({
          to: email,
          subject: "MC3 GRC Platform - Account Request Status",
          message: rejectionTemplate({ reason }),
        });
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
    adminEmail: string = "system",
  ): Promise<boolean> => {
    // (Keep existing suspendUser logic)
    try {
      const userPoolId = getUserPoolId();
      console.log(`Suspending user ${email} by admin: ${adminEmail}`);
      await cognito.send(
        new AdminDisableUserCommand({
          UserPoolId: userPoolId,
          Username: email,
        }),
      );
      await cognito.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: email,
          UserAttributes: [{ Name: "custom:status", Value: "SUSPENDED" }],
        }),
      );

      // First, get the existing user data from DynamoDB
      let existingUserStatus: Partial<UserStatus> = {};
      try {
        const userStatusTableName = getUserStatusTableName();
        const getResponse = await dynamodb.send(
          new GetItemCommand({
            TableName: userStatusTableName,
            Key: marshall({ id: email }),
          }),
        );
        if (getResponse.Item) {
          existingUserStatus = unmarshall(getResponse.Item) as UserStatus;
          console.log(
            `Found existing DynamoDB record for suspension:`,
            JSON.stringify(existingUserStatus),
          );
        } else {
          console.log(
            `No existing DynamoDB record found for ${email}. Will create new one.`,
          );
        }
      } catch (getError) {
        console.error(
          `Error fetching existing UserStatus record for ${email}:`,
          getError,
        );
      }

      const userStatusUpdateData: UserStatus = {
        // Required fields
        id: email,
        email: email,
        status: "suspended",
        role: existingUserStatus.role || "user", // Preserve role
        registrationDate:
          existingUserStatus.registrationDate || new Date().toISOString(),
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
        // Preserve metadata fields
        firstName: existingUserStatus.firstName,
        lastName: existingUserStatus.lastName,
        companyName: existingUserStatus.companyName,
        // Add suspension reason
        suspensionReason: reason,
        // Preserve other fields
        lastLogin: existingUserStatus.lastLogin,
        notes: existingUserStatus.notes,
        approvedBy: existingUserStatus.approvedBy,
      };

      await dynamodb.send(
        new PutItemCommand({
          TableName: getUserStatusTableName(),
          Item: marshall(userStatusUpdateData, { removeUndefinedValues: true }),
        }),
      );
      console.log(
        `Updated UserStatus for ${email} to suspended with preserved metadata.`,
      );

      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_SUSPENDED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          reason: reason || "No reason provided",
          suspendedAt: new Date().toISOString(),
        },
      });
      if (reason)
        await sendEmailHelper({
          to: email,
          subject: "MC3 GRC Platform - Account Status Update",
          message: suspensionTemplate({ reason }),
        });
      return true;
    } catch (error) {
      console.error(`Error suspending user ${email}:`, error);
      return false;
    }
  },

  // Reactivate user
  reactivateUser: async (
    email: string,
    adminEmail: string = "system",
  ): Promise<boolean> => {
    // (Keep existing reactivateUser logic)
    try {
      const userPoolId = getUserPoolId();
      console.log(`Reactivating user ${email} by admin: ${adminEmail}`);

      // Get the existing user data from DynamoDB
      let existingUserStatus: Partial<UserStatus> = {};
      let currentDbStatus: string | undefined;
      try {
        const userStatusTableName = getUserStatusTableName();
        const dbResponse = await dynamodb.send(
          new GetItemCommand({
            TableName: userStatusTableName,
            Key: marshall({ id: email }),
          }),
        );
        if (dbResponse.Item) {
          existingUserStatus = unmarshall(dbResponse.Item) as UserStatus;
          currentDbStatus = existingUserStatus.status;
          console.log(
            `Found existing DynamoDB record for reactivation:`,
            JSON.stringify(existingUserStatus),
          );
        } else {
          console.log(
            `No existing DynamoDB record found for ${email}. Will create new one.`,
          );
          currentDbStatus = "unknown";
        }
      } catch (err) {
        console.warn(`Could not get current DB status for ${email}`);
        currentDbStatus = "unknown";
      }

      await cognito.send(
        new AdminEnableUserCommand({ UserPoolId: userPoolId, Username: email }),
      );
      await cognito.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: email,
          UserAttributes: [{ Name: "custom:status", Value: "ACTIVE" }],
        }),
      );

      const userStatusUpdateData: UserStatus = {
        // Required fields
        id: email,
        email: email,
        status: "active",
        role: existingUserStatus.role || "user", // Preserve role
        registrationDate:
          existingUserStatus.registrationDate || new Date().toISOString(),
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
        // Preserve metadata fields
        firstName: existingUserStatus.firstName,
        lastName: existingUserStatus.lastName,
        companyName: existingUserStatus.companyName,
        // Clear suspension/rejection reasons
        suspensionReason: undefined,
        rejectionReason: undefined,
        // Preserve other fields
        lastLogin: existingUserStatus.lastLogin,
        notes: existingUserStatus.notes,
        approvedBy: existingUserStatus.approvedBy,
      };

      await dynamodb.send(
        new PutItemCommand({
          TableName: getUserStatusTableName(),
          Item: marshall(userStatusUpdateData, { removeUndefinedValues: true }),
        }),
      );
      console.log(
        `Updated UserStatus for ${email} to active with preserved metadata.`,
      );

      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_REACTIVATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          previousStatus: currentDbStatus || "unknown",
          newStatus: "active",
          reactivatedAt: new Date().toISOString(),
        },
      });
      await sendEmailHelper({
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
    firstName?: string,
    lastName?: string,
    companyName?: string,
  ): Promise<{ success: boolean; user?: any; error?: string }> => {
    try {
      const userPoolId = getUserPoolId();
      console.log(
        // Keep log
        `Creating Cognito user ${email} with role ${role} by admin: ${performedBy}`,
      );
      const tempPassword = generateSecurePassword();
      const userAttributes: AttributeType[] = [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "custom:role", Value: role },
        ...(firstName
          ? [
              { Name: "given_name", Value: firstName },
              { Name: "custom:firstName", Value: firstName },
            ]
          : []),
        ...(lastName
          ? [
              { Name: "family_name", Value: lastName },
              { Name: "custom:lastName", Value: lastName },
            ]
          : []),
        ...(companyName
          ? [{ Name: "custom:companyName", Value: companyName }]
          : []),
      ];

      const createCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: userAttributes,
        TemporaryPassword: tempPassword,
        MessageAction: shouldSendEmail ? undefined : "SUPPRESS",
      });
      const response = await cognito.send(createCommand);
      const user = response.User;

      if (!user) {
        throw new Error("Cognito user creation did not return a user object.");
      }

      console.log(`Successfully created Cognito user: ${email}`); // Keep log

      // Explicitly create the DynamoDB UserStatus record with 'pending' status
      const userStatusTableName = getUserStatusTableName();
      const now = new Date().toISOString();
      const userStatusData: UserStatus = {
        id: email,
        email: email,
        status: "pending", // Explicitly set to pending for admin creation
        role: role as "user" | "admin",
        firstName: firstName,
        lastName: lastName,
        companyName: companyName,
        registrationDate: now, // Use current time as registration date
        lastStatusChange: now,
        lastStatusChangeBy: performedBy || "system",
        // Initialize other fields as needed, e.g., leave notes, reasons undefined
      };

      try {
        await dynamodb.send(
          new PutItemCommand({
            TableName: userStatusTableName,
            Item: marshall(userStatusData, { removeUndefinedValues: true }),
          }),
        );
        console.log(
          `Successfully created DynamoDB UserStatus record for ${email} with status 'pending'.`,
        ); // Keep log
      } catch (dbError) {
        console.error(
          `Error creating DynamoDB UserStatus record for ${email}:`,
          dbError,
        );
        // Decide if we should rollback Cognito user or just log the error
        // For now, log and continue, but indicate potential inconsistency
        return {
          success: false,
          error: `Cognito user created, but failed to create DynamoDB record: ${(dbError as Error).message}`,
        };
      }

      // DynamoDB record creation is handled by trigger - REMOVE THIS COMMENT, we now handle it above
      await createAuditLogEntry({
        timestamp: now,
        action: "USER_CREATED",
        performedBy: performedBy || "system",
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          role,
          sendEmail: shouldSendEmail,
          createdAt: now,
          firstName,
          lastName,
          companyName,
        },
      });
      return { success: true, user: user }; // Return the user object from Cognito response
    } catch (error) {
      console.error(`Error creating user ${email}:`, error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update user role
  updateUserRole: async (
    email: string,
    role: string,
    adminEmail: string = "system",
  ): Promise<boolean> => {
    // (Keep existing updateUserRole logic, correcting PutItemCommand)
    try {
      const userPoolId = getUserPoolId();
      //console.log(
      //  `Updating role for user ${email} to ${role} by admin: ${adminEmail}`,
      //);
      let currentCognitoRole = "user";
      try {
        const userData = await cognito.send(
          new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email }),
        );
        currentCognitoRole =
          userData.UserAttributes?.find((a) => a.Name === "custom:role")
            ?.Value || "user";
      } catch (error) {
        console.warn(
          `Error fetching current Cognito role for ${email}:`,
          error,
        );
      }

      await cognito.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: email,
          UserAttributes: [{ Name: "custom:role", Value: role }],
        }),
      );

      // Fetch existing item to merge, or create if not exists
      let existingItem: Partial<UserStatus> = { id: email, email }; // Start with key
      try {
        const getResponse = await dynamodb.send(
          new GetItemCommand({
            TableName: getUserStatusTableName(),
            Key: marshall({ id: email }),
          }),
        );
        if (getResponse.Item) {
          existingItem = unmarshall(getResponse.Item) as UserStatus;
        }
      } catch (getError) {
        console.warn(
          `Could not fetch existing UserStatus for ${email} during role update.`,
        );
      }

      const updatedItem = {
        ...existingItem, // Spread existing data
        role: role,
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
      };

      await dynamodb.send(
        new PutItemCommand({
          TableName: getUserStatusTableName(),
          Item: marshall(updatedItem, { removeUndefinedValues: true }),
        }),
      ); // No merge option needed
      //console.log(`Updated role in DynamoDB for ${email} to ${role}`);

      const currentGroupName =
        currentCognitoRole === "admin" ? "GRC-Admin" : "Approved-Users";
      const newGroupName = role === "admin" ? "GRC-Admin" : "Approved-Users";
      try {
        if (currentGroupName !== newGroupName) {
          try {
            await cognito.send(
              new AdminRemoveUserFromGroupCommand({
                UserPoolId: userPoolId,
                Username: email,
                GroupName: currentGroupName,
              }),
            );
          } catch (removeError: any) {
            if (
              removeError.name !== "UserNotFoundException" &&
              removeError.message?.indexOf("not a member") === -1
            ) {
              console.warn(
                `Could not remove user from group ${currentGroupName}:`,
                removeError,
              );
            }
          }
          await cognito.send(
            new AdminAddUserToGroupCommand({
              UserPoolId: userPoolId,
              Username: email,
              GroupName: newGroupName,
            }),
          );
        }
      } catch (groupError) {
        console.warn(`Error managing Cognito groups for ${email}:`, groupError);
      }

      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_ROLE_UPDATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          newRole: role,
          previousRole: currentCognitoRole,
          updatedAt: new Date().toISOString(),
        },
      });
      return true;
    } catch (error) {
      console.error(`Error updating role for ${email}:`, error);
      return false;
    }
  },

  // Update user profile attributes
  updateUserProfile: async (
    email: string,
    firstName?: string,
    lastName?: string,
    companyName?: string,
    adminEmail: string = "system",
  ): Promise<boolean> => {
    // (Keep existing updateUserProfile logic, correcting PutItemCommand)
    try {
      const userPoolId = getUserPoolId();
      //console.log(`Updating profile for user ${email} by admin: ${adminEmail}`);
      const attributesToUpdateCognito: AttributeType[] = [];
      if (firstName !== undefined) {
        attributesToUpdateCognito.push({
          Name: "given_name",
          Value: firstName,
        });
        attributesToUpdateCognito.push({
          Name: "custom:firstName",
          Value: firstName,
        });
      }
      if (lastName !== undefined) {
        attributesToUpdateCognito.push({
          Name: "family_name",
          Value: lastName,
        });
        attributesToUpdateCognito.push({
          Name: "custom:lastName",
          Value: lastName,
        });
      }
      if (companyName !== undefined) {
        attributesToUpdateCognito.push({
          Name: "custom:companyName",
          Value: companyName,
        });
      }

      if (attributesToUpdateCognito.length > 0) {
        await cognito.send(
          new AdminUpdateUserAttributesCommand({
            UserPoolId: userPoolId,
            Username: email,
            UserAttributes: attributesToUpdateCognito,
          }),
        );
        //console.log(`Cognito profile attributes updated for ${email}`);
      } else {
        //console.log("No Cognito profile attributes to update.");
      }

      const attributesToUpdateDynamo: Partial<UserStatus> = {
        id: email, // Key is required for PutItem
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(companyName !== undefined && { companyName }),
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
      };

      if (Object.keys(attributesToUpdateDynamo).length > 3) {
        // Check if there's more than just key/timestamps
        // Fetch existing item to merge profile data
        let existingItem: Partial<UserStatus> = { id: email, email };
        try {
          const getResponse = await dynamodb.send(
            new GetItemCommand({
              TableName: getUserStatusTableName(),
              Key: marshall({ id: email }),
            }),
          );
          if (getResponse.Item) {
            existingItem = unmarshall(getResponse.Item) as UserStatus;
          }
        } catch (getError) {
          console.warn(
            `Could not fetch existing UserStatus for ${email} during profile update.`,
          );
        }

        const updatedItem = { ...existingItem, ...attributesToUpdateDynamo }; // Merge new data over existing

        await dynamodb.send(
          new PutItemCommand({
            TableName: getUserStatusTableName(),
            Item: marshall(updatedItem, { removeUndefinedValues: true }),
          }),
        ); // No merge option
        //console.log(`DynamoDB profile attributes updated for ${email}`);
      } else {
        //console.log("No DynamoDB profile attributes to update.");
      }

      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_PROFILE_UPDATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          updatedFields: attributesToUpdateCognito.map((a) => a.Name),
          updatedAt: new Date().toISOString(),
        },
      });
      return true;
    } catch (error) {
      console.error(`Error updating profile for ${email}:`, error);
      return false;
    }
  },

  // Get admin dashboard statistics
  getAdminStats: async (): Promise<AdminStats> => {
    try {
      //console.log("[getAdminStats] Starting getAdminStats function");

      // Initialize stats object
      const stats: AdminStats = {
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

      // --- Get User Statistics ---

      // 1. Get Total Users from DynamoDB
      let totalDynamoUsers = 0;
      const userStatusTableName = getUserStatusTableName();
      try {
        //console.log(
        //  `[getAdminStats] Scanning UserStatus table for total count: ${userStatusTableName}`,
        //);
        const scanCommand = new ScanCommand({
          TableName: userStatusTableName,
          Select: "COUNT", // Only get the count
        });
        const userStatusResponse = await dynamodb.send(scanCommand);
        totalDynamoUsers = userStatusResponse.Count || 0;
        stats.users.total = totalDynamoUsers;
        //console.log(
        //  `[getAdminStats] Total users found in DynamoDB: ${totalDynamoUsers}`,
        //);
      } catch (error) {
        console.error(
          `[getAdminStats] Error scanning UserStatus table (${userStatusTableName}) for total count:`,
          error,
        );
        stats.users.total = 0; // Default to 0 if scan fails
      }

      // 2. Get Active, Pending, Suspended counts from Cognito
      let cognitoActive = 0;
      let cognitoPending = 0;
      let cognitoSuspended = 0;
      try {
        const userPoolId = getUserPoolId();
        //console.log(
        //  `[getAdminStats] Fetching users from Cognito pool: ${userPoolId} for status counts.`,
        //);
        let paginationToken: string | undefined = undefined;
        let allCognitoUsers: UserType[] = [];

        // Paginate through all Cognito users
        do {
          const listUsersCommand = new ListUsersCommand({
            UserPoolId: userPoolId,
            // Limit: 60, // Fetch in batches if needed, but we need all for counts
            PaginationToken: paginationToken,
          });
          // Explicitly type the response
          const cognitoResponse: import("@aws-sdk/client-cognito-identity-provider").ListUsersCommandOutput =
            await cognito.send(listUsersCommand);
          allCognitoUsers = allCognitoUsers.concat(cognitoResponse.Users || []);
          paginationToken = cognitoResponse.PaginationToken;
        } while (paginationToken);

        //console.log(
        //  `[getAdminStats] Total users fetched from Cognito: ${allCognitoUsers.length}`,
        //);

        // Count users based on Enabled status and custom:status attribute
        allCognitoUsers.forEach((user) => {
          const attributes =
            user.Attributes?.reduce(
              (acc, attr) => {
                if (attr.Name) acc[attr.Name] = attr.Value;
                return acc;
              },
              {} as Record<string, string | undefined>,
            ) || {};

          const customStatus = attributes["custom:status"];
          const cognitoStatus = user.UserStatus;

          if (user.Enabled) {
            // Count Enabled users as Active
            cognitoActive++;
          } else {
            // If user is Disabled in Cognito:
            if (customStatus === "SUSPENDED") {
              cognitoSuspended++;
            }
            // Consider Disabled users (that aren't suspended) as Pending
            // This includes UNCONFIRMED, FORCE_CHANGE_PASSWORD, or even CONFIRMED but disabled post-confirmation
            else if (customStatus !== "REJECTED") {
              // Exclude explicitly rejected users
              cognitoPending++;
            }
            // Note: Rejected users aren't explicitly counted here based on Cognito status alone.
            // The total - active - pending - suspended gives an idea, but DynamoDB holds the explicit 'rejected' state if needed.
          }
        });

        stats.users.active = cognitoActive;
        stats.users.pending = cognitoPending;
        stats.users.suspended = cognitoSuspended;
        // Note: Rejected count will be derived if needed: Total(Dynamo) - Active - Pending - Suspended
        // However, the UI requirement might just want these specific counts
        // stats.users.rejected = stats.users.total - cognitoActive - cognitoPending - cognitoSuspended;

        //console.log(
        //  `[getAdminStats] Calculated user counts from Cognito: Active=${cognitoActive}, Pending=${cognitoPending}, Suspended=${cognitoSuspended}`,
        //);
      } catch (cognitoError) {
        console.error(
          "[getAdminStats] Error fetching users from Cognito:",
          cognitoError,
        );
        // Reset Cognito-based counts if fetching fails
        stats.users.active = 0;
        stats.users.pending = 0;
        stats.users.suspended = 0;
      }

      // NOTE: Removed the reconciliation logic that previously scanned DynamoDB and compared with Cognito.
      // Total count now comes purely from DynamoDB, other counts from Cognito.

      // --- Get Assessment Statistics ---
      try {
        const completedTableName = getCompletedAssessmentTableName();
        const inProgressTableName = getInProgressAssessmentTableName();
        //console.log(
        //  `[getAdminStats] Fetching assessments. Completed: ${completedTableName}, InProgress: ${inProgressTableName}`,
        //);

        const [completedResponse, inProgressResponse] = await Promise.all([
          dynamodb.send(new ScanCommand({ TableName: completedTableName })),
          dynamodb.send(new ScanCommand({ TableName: inProgressTableName })),
        ]);

        const completedAssessments = (completedResponse.Items || []).map(
          (item) => unmarshall(item),
        );
        const inProgressAssessments = (inProgressResponse.Items || []).map(
          (item) => unmarshall(item),
        );

        stats.assessments.completed = completedAssessments.length;
        stats.assessments.inProgress = inProgressAssessments.length;
        stats.assessments.total =
          stats.assessments.completed + stats.assessments.inProgress;
        stats.assessments.compliant = completedAssessments.filter(
          (a: any) => a.isCompliant === true,
        ).length;
        stats.assessments.nonCompliant = completedAssessments.filter(
          (a: any) => a.isCompliant === false,
        ).length;
        stats.complianceRate =
          stats.assessments.completed > 0
            ? Math.round(
                (stats.assessments.compliant / stats.assessments.completed) *
                  100,
              )
            : 0;
        //console.log(`[getAdminStats] Assessment stats:`, stats.assessments);
      } catch (error) {
        console.error(
          "[getAdminStats] Error fetching assessment statistics:",
          error,
        );
        stats.assessments = {
          total: 0,
          inProgress: 0,
          completed: 0,
          compliant: 0,
          nonCompliant: 0,
        };
        stats.complianceRate = 0;
      }

      // --- Get Recent Activities ---
      try {
        const auditLogTableName = getAuditLogTableName();
        //console.log(
        //  `[getAdminStats] Fetching recent activity from: ${auditLogTableName}`,
        //);
        const auditLogResponse = await dynamodb.send(
          new ScanCommand({
            TableName: auditLogTableName,
            Limit: 50, // Limit recent activities
          }),
        );

        let activities = (auditLogResponse.Items || []).map(
          (item) => unmarshall(item) as AuditLog,
        );
        // Sort by timestamp descending
        activities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        stats.recentActivity = activities.slice(0, 50); // Ensure limit
        //console.log(
        //  `[getAdminStats] Fetched ${stats.recentActivity.length} recent activities.`,
        //);
      } catch (error) {
        console.error("[getAdminStats] Error fetching recent activity:", error);
        stats.recentActivity = [];
      }

      //console.log("[getAdminStats] Final stats object:", stats);
      return stats;
    } catch (error) {
      console.error("[getAdminStats] General error in getAdminStats:", error);
      // Return empty stats object in case of a major failure
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
    // (Keep existing getAuditLogs logic)
    try {
      const tableName = getAuditLogTableName();
      const dynamodb = getDynamoDBClient();
      let scanInput: any = { TableName: tableName };
      let filterExpressions: string[] = [];
      let expressionAttributeNames: Record<string, string> = {};
      let expressionAttributeValues: Record<string, any> = {};

      if (dateRange?.startDate) {
        filterExpressions.push("#ts >= :startDate");
        expressionAttributeNames["#ts"] = "timestamp";
        expressionAttributeValues[":startDate"] = {
          S: new Date(dateRange.startDate).toISOString(),
        };
      }
      if (dateRange?.endDate) {
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        filterExpressions.push("#ts <= :endDate");
        expressionAttributeNames["#ts"] = "timestamp";
        expressionAttributeValues[":endDate"] = { S: endDate.toISOString() };
      }
      if (filters?.action) {
        filterExpressions.push("contains(#action, :actionVal)");
        expressionAttributeNames["#action"] = "action";
        expressionAttributeValues[":actionVal"] = { S: filters.action };
      }
      if (filters?.performedBy) {
        filterExpressions.push("performedBy = :performedByVal");
        expressionAttributeValues[":performedByVal"] = {
          S: filters.performedBy,
        };
      }
      if (filters?.affectedResource) {
        filterExpressions.push("affectedResource = :affectedResourceVal");
        expressionAttributeValues[":affectedResourceVal"] = {
          S: filters.affectedResource,
        };
      }

      if (filterExpressions.length > 0) {
        scanInput.FilterExpression = filterExpressions.join(" AND ");
        if (Object.keys(expressionAttributeNames).length > 0) {
          scanInput.ExpressionAttributeNames = expressionAttributeNames;
        }
        scanInput.ExpressionAttributeValues = expressionAttributeValues;
      }

      const commandInput = new ScanCommand(scanInput); // Using Scan for simplicity
      const response = await dynamodb.send(commandInput);
      let logs = (response.Items || []).map((item) =>
        unmarshall(item),
      ) as AuditLog[];
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
    // (Keep existing getAllSystemSettings logic)
    try {
      //console.log("Fetching system settings");
      const command = new ScanCommand({
        TableName: getSystemSettingsTableName(),
      });
      const response = await dynamodb.send(command);
      if (!response.Items || response.Items.length === 0) {
        return JSON.stringify({ settings: [], settingsByCategory: {} });
      }
      const settings = response.Items.map((item) =>
        unmarshall(item),
      ) as SystemSetting[];
      const settingsByCategory: Record<string, SystemSetting[]> = {};
      settings.forEach((setting) => {
        const category = setting.category || "general";
        if (!settingsByCategory[category]) settingsByCategory[category] = [];
        settingsByCategory[category].push(setting);
      });
      return JSON.stringify({ settings, settingsByCategory });
    } catch (error) {
      console.error("Error retrieving system settings:", error);
      return JSON.stringify({
        error: "Failed to retrieve system settings",
        settings: [],
        settingsByCategory: {},
      });
    }
  },

  // Update system settings
  updateSystemSettings: async (
    settings: SystemSetting | SystemSetting[],
    updatedBy?: string,
  ): Promise<string> => {
    // (Keep existing updateSystemSettings logic)
    try {
      //console.log("Updating system settings:", settings);
      const settingsArray = Array.isArray(settings) ? settings : [settings];
      const now = new Date().toISOString();
      const updatedSettings: SystemSetting[] = [];
      for (const setting of settingsArray) {
        try {
          if (!setting.id)
            setting.id = `setting-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          setting.lastUpdated = now;
          if (updatedBy) setting.updatedBy = updatedBy;
          const item = marshall(setting, { removeUndefinedValues: true });
          await dynamodb.send(
            new PutItemCommand({
              TableName: getSystemSettingsTableName(),
              Item: item,
            }),
          );
          updatedSettings.push(setting);
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
    adminEmail: string = "system",
  ): Promise<{ success: boolean; message: string }> => {
    // (Keep existing deleteUser logic)
    try {
      console.log(
        // Keep console log
        `Attempting to delete user: ${email} by admin: ${adminEmail}`,
      );
      const userPoolId = getUserPoolId();
      const userStatusTableName = getUserStatusTableName();

      // Fetch the existing user data first to preserve metadata
      let existingUserStatus: Partial<UserStatus> = {};
      try {
        const getResponse = await dynamodb.send(
          new GetItemCommand({
            TableName: userStatusTableName,
            Key: marshall({ id: email }),
          }),
        );
        if (getResponse.Item) {
          existingUserStatus = unmarshall(getResponse.Item) as UserStatus;
          console.log(
            `[deleteUser] Found existing DynamoDB record:`,
            JSON.stringify(existingUserStatus),
          );
        } else {
          console.log(
            `[deleteUser] No existing DynamoDB record found for ${email}. Proceeding with deletion mark.`,
          );
        }
      } catch (getError) {
        console.error(
          `[deleteUser] Error fetching existing UserStatus record for ${email}:`,
          getError,
        );
        // Continue even if fetch fails, we still want to mark as deleted
      }

      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      const ttl = Math.floor(Date.now() / 1000) + thirtyDaysInSeconds;

      // Prepare merged data for DynamoDB update
      const userStatusUpdateData: UserStatus = {
        // Merge existing data
        ...existingUserStatus,
        // Required fields (overwrite if necessary)
        id: email,
        email: email,
        status: "deleted", // Set status to deleted
        role: existingUserStatus.role || "user", // Preserve role or default
        registrationDate:
          existingUserStatus.registrationDate || new Date().toISOString(), // Preserve registration date
        lastStatusChange: new Date().toISOString(), // Always update this
        lastStatusChangeBy: adminEmail, // Always update this
        ttl, // Set the TTL for automatic deletion
        // Preserve other optional fields
        firstName: existingUserStatus.firstName,
        lastName: existingUserStatus.lastName,
        companyName: existingUserStatus.companyName,
        lastLogin: existingUserStatus.lastLogin,
        notes: existingUserStatus.notes,
        approvedBy: existingUserStatus.approvedBy,
        rejectionReason: existingUserStatus.rejectionReason,
        suspensionReason: existingUserStatus.suspensionReason,
      };

      await dynamodb.send(
        new PutItemCommand({
          TableName: userStatusTableName,
          Item: marshall(userStatusUpdateData, { removeUndefinedValues: true }),
        }),
      ); // Use PutItem with merged data
      console.log(
        `Marked UserStatus for ${email} as deleted with TTL and preserved metadata.`,
      ); // Updated log

      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_DELETED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          deletedAt: new Date().toISOString(),
          deletedBy: adminEmail,
        },
      });

      // Add assessment cleanup logic here if needed

      try {
        await cognito.send(
          new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: email,
          }),
        );
        console.log(`Successfully deleted Cognito user: ${email}`); // Keep log
      } catch (cognitoDeleteError) {
        console.error(
          // Keep log
          `Error deleting Cognito user ${email}:`,
          cognitoDeleteError,
        );
      }
      return {
        success: true,
        message: `User ${email} has been marked for deletion and Cognito user deleted.`,
      };
    } catch (error) {
      console.error("Error deleting user:", error);
      return {
        success: false,
        message: `Failed to delete user: ${(error as Error).message}`,
      };
    }
  },

  // Migrate users from Cognito to DynamoDB
  migrateUsersToDynamoDB: async (): Promise<{
    success: boolean;
    count: number;
    errors: number;
  }> => {
    try {
      //console.log("Starting user migration from Cognito to DynamoDB");
      const userPoolId = getUserPoolId();

      // List all users from Cognito
      const listCommand = new ListUsersCommand({
        UserPoolId: userPoolId,
        Limit: 60, // Max limit
      });

      const cognito = getCognitoClient();
      const response = await cognito.send(listCommand);
      const users = response.Users || [];
      //console.log(`Found ${users.length} users in Cognito`);

      let successCount = 0;
      let errorCount = 0;

      // Process each user
      for (const user of users) {
        const attributes: Record<string, string> = {};
        user.Attributes?.forEach((attr) => {
          if (attr.Name && attr.Value) attributes[attr.Name] = attr.Value;
        });

        const email = attributes.email || user.Username || "";
        if (!email) {
          console.warn("Skipping user with no email");
          errorCount++;
          continue;
        }

        try {
          // Extract profile data
          const firstName =
            attributes.given_name || attributes["custom:firstName"];
          const lastName =
            attributes.family_name || attributes["custom:lastName"];
          const companyName = attributes["custom:companyName"];

          // Get custom status or determine based on enabled state
          let status: UserStatus["status"] = "pending";
          if (attributes["custom:status"] === "ACTIVE" && user.Enabled) {
            status = "active";
          } else if (
            attributes["custom:status"] === "SUSPENDED" ||
            !user.Enabled
          ) {
            status = "suspended";
          } else if (attributes["custom:status"] === "REJECTED") {
            status = "rejected";
          }

          // Get user role
          const role = attributes["custom:role"] || "user";

          // Build the DynamoDB record
          const userStatusData: Partial<UserStatus> = {
            id: email,
            email,
            status,
            role: role as "user" | "admin",
            registrationDate:
              user.UserCreateDate?.toISOString() || new Date().toISOString(),
            lastStatusChange: user.UserLastModifiedDate?.toISOString(),
            firstName,
            lastName,
            companyName,
          };

          // Write to DynamoDB
          //console.log(
          //  `Writing user ${email} to DynamoDB with status ${status}`,
          //);
          await dynamodb.send(
            new PutItemCommand({
              TableName: getUserStatusTableName(),
              Item: marshall(userStatusData, { removeUndefinedValues: true }),
            }),
          );

          successCount++;
        } catch (userError) {
          console.error(`Error migrating user ${email}:`, userError);
          errorCount++;
        }
      }

      //console.log(
      //  `Migration complete: ${successCount} succeeded, ${errorCount} failed`,
      //);

      // Create audit log entry
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USERS_MIGRATED",
        performedBy: "system",
        affectedResource: "userStatus",
        details: {
          successCount,
          errorCount,
          totalAttempted: users.length,
        },
      });

      return { success: true, count: successCount, errors: errorCount };
    } catch (error) {
      console.error("Error in migrateUsersToDynamoDB:", error);
      return { success: false, count: 0, errors: 1 };
    }
  },
}; // End of userOperations object

//console.log("User operations module loaded.");
