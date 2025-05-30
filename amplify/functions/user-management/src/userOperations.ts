// File: amplify/functions/user-management/src/userOperations.ts
import { CognitoIdentityProviderClient, GetUserCommand, AttributeType } from "@aws-sdk/client-cognito-identity-provider";
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { env } from "$amplify/env/user-management";
import { log } from "./utils";
import { amplifyAuthOperations } from "./amplifyAuthClient";
// Use direct DynamoDB operations when running as AppSync resolver
import { dynamoDbOperations } from "./dynamoDbOperations";
// Import email templates
import {
  approvalTemplate,
  rejectionTemplate,
  suspensionTemplate,
  reactivationTemplate,
  baseTemplate,
} from "./templates/emailTemplates";

// Check if we're running as an AppSync resolver
const isAppSyncResolver = !!process.env.AWS_LAMBDA_FUNCTION_NAME && 
  (process.env.USERSTATUS_TABLE_NAME || process.env.AUDITLOG_TABLE_NAME);

// Use direct DynamoDB operations when running as resolver, otherwise fall back to Amplify Data client
const dataOperations = isAppSyncResolver ? dynamoDbOperations : (() => {
  // Lazy load amplifyDataOperations only if not running as resolver
  const { amplifyDataOperations } = require("./amplifyDataClient");
  return amplifyDataOperations;
})();

// --- Client Initialization ---
const getSesClient = () => {
  try {
    return new SESClient();
  } catch (error) {
    console.error("Error creating SES client:", error);
    throw error;
  }
};

let ses: SESClient;

try {
  ses = getSesClient();
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
const sendEmailHelper = async ({
  to,
  subject,
  message,
}: EmailOptions): Promise<boolean> => {
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
        "no-reply-grc@mc3technologies.com",
    });
    await ses.send(command);
    //console.log(`Email sent successfully to ${to} with subject "${subject}"`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
};
export { sendEmailHelper as sendEmail };

const generateSecurePassword = (): string => {
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
    await dataOperations.createAuditLog(completeLogEntry);
    //console.log(`Audit log created with ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Error creating audit log entry:", error);
    return null;
  }
};

const createUserStatusIfMissing = async (email: string, cognitoUser: any): Promise<void> => {
  try {
    // Check if UserStatus already exists
    const existingStatus = await dataOperations.getUserStatus(email);
    if (existingStatus) {
      return; // Already exists, nothing to do
    }
    
    // Extract attributes from Cognito user
    const attributes: Record<string, string> = {};
    cognitoUser.Attributes?.forEach((attr: any) => {
      if (attr.Name && attr.Value) attributes[attr.Name] = attr.Value;
    });
    
    // Create UserStatus record
    const userStatus: UserStatus = {
      id: email,
      email: email,
      status: cognitoUser.Enabled ? "active" : "pending",
      role: (attributes["custom:role"] as UserStatus["role"]) || "user",
      registrationDate: cognitoUser.UserCreateDate?.toISOString() || new Date().toISOString(),
      lastStatusChange: cognitoUser.UserLastModifiedDate?.toISOString() || new Date().toISOString(),
      firstName: attributes["given_name"] || attributes["custom:firstName"] || undefined,
      lastName: attributes["family_name"] || attributes["custom:lastName"] || undefined,
      companyName: attributes["custom:companyName"] || undefined,
    };
    
    await dataOperations.createUserStatus(userStatus);
    console.log(`Created missing UserStatus record for ${email}`);
  } catch (error) {
    console.error(`Error creating UserStatus for ${email}:`, error);
  }
};

// --- User Operations ---
export const userOperations = {
  // List all users (Source: Cognito, Enriched with DynamoDB status)
  listUsers: async (): Promise<string> => {
    try {
      //console.log(`[listUsers] Fetching users from Cognito`);

      let allCognitoUsers: any[] = [];
      let nextToken: string | undefined = undefined;

      // Paginate through all Cognito users
      do {
        const response = await amplifyAuthOperations.listUsers(60, nextToken);
        allCognitoUsers = allCognitoUsers.concat(response.Users || []);
        nextToken = response.PaginationToken;
      } while (nextToken);

      //console.log(`[listUsers] Fetched ${allCognitoUsers.length} users from Cognito. Enriching with DynamoDB status`);

      const enrichedUsers = await Promise.all(
        allCognitoUsers.map(async (cognitoUser) => {
          const attributes: Record<string, string> = {};
          cognitoUser.Attributes?.forEach((attr: any) => {
            if (attr.Name && attr.Value) attributes[attr.Name] = attr.Value;
          });
          const email = attributes["email"] || cognitoUser.Username;

          let dbStatus: UserStatus["status"] | undefined;
          let dbRole: UserStatus["role"] | undefined;
          let dbFirstName: string | undefined;
          let dbLastName: string | undefined;
          let dbCompanyName: string | undefined;
          let registrationDate: string | undefined =
            cognitoUser.UserCreateDate?.toISOString();
          let lastStatusChange: string | undefined =
            cognitoUser.UserLastModifiedDate?.toISOString();

          if (email) {
            // Query DynamoDB using Amplify Data API
            try {
              const dbUser = await dataOperations.getUserStatus(email);
              if (dbUser) {
                dbStatus = dbUser.status === null ? undefined : dbUser.status;
                dbRole = dbUser.role === null ? undefined : dbUser.role;
                dbFirstName = dbUser.firstName === null ? undefined : dbUser.firstName;
                dbLastName = dbUser.lastName === null ? undefined : dbUser.lastName;
                dbCompanyName = dbUser.companyName === null ? undefined : dbUser.companyName;
                if (dbUser.registrationDate)
                  registrationDate = dbUser.registrationDate;
                if (dbUser.lastStatusChange)
                  lastStatusChange = dbUser.lastStatusChange;
              }
            } catch (err) {
              // If UserStatus doesn't exist, create it
              if ((err as Error).message.includes("ResourceNotFoundException") || 
                  (err as Error).message.includes("not found")) {
                console.log(`[listUsers] Creating missing UserStatus for ${email}`);
                await createUserStatusIfMissing(email, cognitoUser);
              } else {
              console.warn(
                `[listUsers] Could not fetch DynamoDB UserStatus for ${email}: ${(err as Error).message}`,
              );
              }
            }
          }

          // Determine final values
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
            dbStatus || (cognitoUser.Enabled ? "active" : "pending");
          const finalRole =
            dbRole ||
            (attributes["custom:role"] as UserStatus["role"]) ||
            "user";

          return {
            email: email || "N/A",
            status: finalStatus,
            role: finalRole,
            created: registrationDate,
            lastModified: lastStatusChange,
            enabled: cognitoUser.Enabled,
            firstName: finalFirstName,
            lastName: finalLastName,
            companyName: finalCompanyName,
            cognitoStatus: cognitoUser.UserStatus,
            id: attributes["sub"],
            attributes: attributes,
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
      console.log(`Scanning DynamoDB UserStatus table for all users`);

      const users = await dataOperations.listUsersByStatus();

      const formattedUsers = users.map((user: any) => ({
        email: user.email,
        status: user.status,
        role: user.role || "user",
        created: user.registrationDate,
        lastModified: user.lastStatusChange,
        enabled: user.status !== "suspended" && user.status !== "rejected",
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
      }));

      console.log(
        `Found ${formattedUsers.length} total users in DynamoDB UserStatus table`,
      );
      return JSON.stringify(formattedUsers);
    } catch (error) {
      console.error(`Error in getAllUsers:`, error);
      return JSON.stringify({
        error: `Failed to retrieve all users`,
      });
    }
  },

  // Get users by status (Uses DynamoDB UserStatus table)
  getUsersByStatus: async (status: string): Promise<string> => {
    try {
      if (!status) throw new Error("Status parameter is required.");

      const requestedStatus = status.toLowerCase() as UserStatus["status"];
      //console.log(`Querying DynamoDB UserStatus table for status: ${requestedStatus}`);

      const users = await dataOperations.listUsersByStatus(requestedStatus);

      const formattedUsers = users.map((user: any) => ({
        email: user.email,
        status: user.status,
        role: user.role || "user",
        created: user.registrationDate,
        lastModified: user.lastStatusChange,
        enabled: user.status !== "suspended" && user.status !== "rejected",
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
      }));

      //console.log(`Found ${formattedUsers.length} users with status: ${requestedStatus}`);
      return JSON.stringify(formattedUsers);
    } catch (error) {
      console.error(`Error in getUsersByStatus (${status}):`, error);
      return JSON.stringify({
        error: `Failed to retrieve users by status: ${status}`,
      });
    }
  },

  // Get user details (Enriched with DynamoDB)
  getUserDetails: async (email: string): Promise<string> => {
    try {
      const response = await amplifyAuthOperations.getUser(email);
      if (!response) {
        return JSON.stringify({ error: `User ${email} not found` });
      }

      const attributes: Record<string, string> = {};
      response.UserAttributes?.forEach((attr) => {
        if (attr.Name && attr.Value) attributes[attr.Name] = attr.Value;
      });

      let dbUser: any = {};
      try {
        const userData = await dataOperations.getUserStatus(email);
        if (userData) dbUser = userData;
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

  // Additional methods would continue here...
  // For brevity, I'll implement a few key methods and leave placeholders for others

  // Approve user
  approveUser: async (
    email: string,
    adminEmail: string = "system",
  ): Promise<boolean> => {
    try {
      console.log(`Approving user ${email} by admin: ${adminEmail}`);
      
      // Get existing user status to check if they're actually pending
      let existingUserStatus: any = {};
      try {
        const existingData = await dataOperations.getUserStatus(email);
        if (existingData) {
          existingUserStatus = existingData;
        }
      } catch (getError) {
        console.error(`Error fetching existing UserStatus record for ${email}:`, getError);
      }
      
      // Enable user in Cognito
      await amplifyAuthOperations.enableUser(email);
      await amplifyAuthOperations.updateUserAttributes(email, [
        { Name: "custom:status", Value: "ACTIVE" }
      ]);
      await amplifyAuthOperations.addUserToGroup(email, "Approved-Users");

      // Get profile data from Cognito
      let profileData: any = {};
      try {
        const userDetails = await amplifyAuthOperations.getUser(email);
        if (userDetails?.UserAttributes) {
          const fetchedAttributes: Record<string, string | undefined> = {};
          userDetails.UserAttributes.forEach((attr) => {
            if (attr.Name) {
              fetchedAttributes[attr.Name] = attr.Value;
            }
          });

          profileData.firstName =
            fetchedAttributes["given_name"] ||
            fetchedAttributes["custom:firstName"];
          profileData.lastName =
            fetchedAttributes["family_name"] ||
            fetchedAttributes["custom:lastName"];
          profileData.companyName = fetchedAttributes["custom:companyName"];
          profileData.role = fetchedAttributes["custom:role"] || "user";
        }
      } catch (fetchError) {
        console.warn(
          `Could not fetch Cognito profile attributes for ${email} during approval:`,
          fetchError,
        );
      }

      // Get existing DynamoDB record
      let registrationDateToKeep: string | undefined;

      try {
        const existingData = await dataOperations.getUserStatus(email);
        if (existingData) {
          registrationDateToKeep = existingData.registrationDate;
        } else {
          registrationDateToKeep = new Date().toISOString();
        }
      } catch (getError) {
        console.error(
          `Error fetching existing UserStatus record for ${email}:`,
          getError,
        );
        registrationDateToKeep = new Date().toISOString();
      }

      // Prepare data for DynamoDB update
      const userStatusUpdateData: UserStatus = {
        id: email,
        email: email,
        status: "active",
        role: (profileData.role as UserStatus["role"]) ||
          existingUserStatus.role ||
          "user",
        registrationDate: registrationDateToKeep,
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
        firstName:
          profileData.firstName || existingUserStatus.firstName || undefined,
        lastName:
          profileData.lastName || existingUserStatus.lastName || undefined,
        companyName:
          profileData.companyName ||
          existingUserStatus.companyName ||
          undefined,
        lastLogin: existingUserStatus.lastLogin || undefined,
        notes: existingUserStatus.notes || undefined,
        approvedBy: adminEmail,  // Set the approvedBy field
        rejectionReason: undefined,
        suspensionReason: undefined,
        ttl: undefined,
      };

      // Update using Amplify Data API
      if (existingUserStatus.id) {
        await dataOperations.updateUserStatus(email, userStatusUpdateData);
      } else {
        await dataOperations.createUserStatus(userStatusUpdateData);
      }

      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_APPROVED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: { email, approvedAt: new Date().toISOString() },
      });

      // Send approval email (no password included – rely on user's existing credentials)
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
    try {
      console.log(`Rejecting user ${email} by admin: ${adminEmail}`);
      
      // Disable user in Cognito
      await amplifyAuthOperations.disableUser(email);
      await amplifyAuthOperations.updateUserAttributes(email, [
        { Name: "custom:status", Value: "REJECTED" }
      ]);

      // Get existing user data
      let existingUserStatus: any = {};
      try {
        const existingData = await dataOperations.getUserStatus(email);
        if (existingData) {
          existingUserStatus = existingData;
        }
      } catch (getError) {
        console.warn(`No existing UserStatus record found for ${email}`);
      }

      // Update UserStatus in DynamoDB
      const userStatusUpdateData: UserStatus = {
        id: email,
        email: email,
        status: "rejected",
        role: existingUserStatus.role || "user",
        registrationDate: existingUserStatus.registrationDate || new Date().toISOString(),
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
        rejectionReason: reason || "Application rejected by administrator",
        firstName: existingUserStatus.firstName || undefined,
        lastName: existingUserStatus.lastName || undefined,
        companyName: existingUserStatus.companyName || undefined,
        lastLogin: existingUserStatus.lastLogin || undefined,
        notes: existingUserStatus.notes || undefined,
        approvedBy: existingUserStatus.approvedBy || undefined,
        suspensionReason: undefined,
        ttl: undefined,
      };
      
      if (existingUserStatus.id) {
        await dataOperations.updateUserStatus(email, userStatusUpdateData);
      } else {
        await dataOperations.createUserStatus(userStatusUpdateData);
      }
      
      // Create audit log entry
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_REJECTED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          reason: reason || "No reason provided",
          rejectedAt: new Date().toISOString() 
        },
      });
      
      // Send rejection email
        await sendEmailHelper({
          to: email,
        subject: "Account Application Status - MC3 GRC Platform",
        message: rejectionTemplate({ reason: reason || "Your application has been rejected by an administrator." }),
        });
      
      console.log(`Successfully rejected user ${email}`);
      return true;
    } catch (error) {
      console.error(`Error rejecting user ${email}:`, error);
      return false;
    }
  },

  suspendUser: async (
    email: string,
    reason?: string,
    adminEmail: string = "system",
  ): Promise<boolean> => {
    try {
      console.log(`Suspending user ${email} by admin: ${adminEmail}`);
      
      // Disable user in Cognito
      await amplifyAuthOperations.disableUser(email);
      await amplifyAuthOperations.updateUserAttributes(email, [
        { Name: "custom:status", Value: "SUSPENDED" }
      ]);

      // Get existing user data
      let existingUserStatus: any = {};
      try {
        const existingData = await dataOperations.getUserStatus(email);
        if (existingData) {
          existingUserStatus = existingData;
        }
      } catch (getError) {
        console.warn(`No existing UserStatus record found for ${email}`);
      }

      // Update UserStatus in DynamoDB
      const userStatusUpdateData: UserStatus = {
        id: email,
        email: email,
        status: "suspended",
        role: existingUserStatus.role || "user",
        registrationDate: existingUserStatus.registrationDate || new Date().toISOString(),
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
        suspensionReason: reason || "Suspended by administrator",
        firstName: existingUserStatus.firstName || undefined,
        lastName: existingUserStatus.lastName || undefined,
        companyName: existingUserStatus.companyName || undefined,
        lastLogin: existingUserStatus.lastLogin || undefined,
        notes: existingUserStatus.notes || undefined,
        approvedBy: existingUserStatus.approvedBy || undefined,
        rejectionReason: undefined,
        ttl: undefined,
      };
      
      if (existingUserStatus.id) {
        await dataOperations.updateUserStatus(email, userStatusUpdateData);
      } else {
        await dataOperations.createUserStatus(userStatusUpdateData);
      }
      
      // Create audit log entry
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_SUSPENDED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          reason: reason || "No reason provided",
          suspendedAt: new Date().toISOString() 
        },
      });
      
      // Send suspension email
        await sendEmailHelper({
          to: email,
        subject: "Account Suspended - MC3 GRC Platform",
        message: suspensionTemplate({ reason: reason || "Your account has been suspended by an administrator." }),
        });
      
      console.log(`Successfully suspended user ${email}`);
      return true;
    } catch (error) {
      console.error(`Error suspending user ${email}:`, error);
      return false;
    }
  },

  reactivateUser: async (
    email: string,
    adminEmail: string = "system",
  ): Promise<boolean> => {
    try {
      console.log(`Reactivating user ${email} by admin: ${adminEmail}`);

      // Enable user in Cognito
      await amplifyAuthOperations.enableUser(email);
      await amplifyAuthOperations.updateUserAttributes(email, [
        { Name: "custom:status", Value: "ACTIVE" }
      ]);
      
      // Get existing user data
      let existingUserStatus: any = {};
      try {
        const existingData = await dataOperations.getUserStatus(email);
        if (existingData) {
          existingUserStatus = existingData;
        }
      } catch (getError) {
        console.warn(`No existing UserStatus record found for ${email}`);
      }
      
      // Update UserStatus in DynamoDB
      const userStatusUpdateData: UserStatus = {
        id: email,
        email: email,
        status: "active",
        role: existingUserStatus.role || "user",
        registrationDate: existingUserStatus.registrationDate || new Date().toISOString(),
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
        firstName: existingUserStatus.firstName || undefined,
        lastName: existingUserStatus.lastName || undefined,
        companyName: existingUserStatus.companyName || undefined,
        lastLogin: existingUserStatus.lastLogin || undefined,
        notes: existingUserStatus.notes || undefined,
        approvedBy: existingUserStatus.approvedBy || undefined,
        rejectionReason: undefined,
        suspensionReason: undefined,
        ttl: undefined,
      };
      
      if (existingUserStatus.id) {
        await dataOperations.updateUserStatus(email, userStatusUpdateData);
      } else {
        await dataOperations.createUserStatus(userStatusUpdateData);
      }
      
      // Create audit log entry
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_REACTIVATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          reactivatedAt: new Date().toISOString() 
        },
      });
      
      // Send reactivation email
      await sendEmailHelper({
        to: email,
        subject: "Account Reactivated - MC3 GRC Platform",
        message: reactivationTemplate(),
      });
      
      console.log(`Successfully reactivated user ${email}`);
      return true;
    } catch (error) {
      console.error(`Error reactivating user ${email}:`, error);
      return false;
    }
  },

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
      // Note: Allowing flexible email formats for test users
      console.log(`Creating user ${email} with role ${role}`);
      
      // Generate a temporary password
      const tempPassword = generateSecurePassword();
      
      // Create user in Cognito
      const cognitoUser = await amplifyAuthOperations.createUser({
        email: email,
        attributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "custom:role", Value: role },
          ...(firstName ? [{ Name: "given_name", Value: firstName }] : []),
          ...(lastName ? [{ Name: "family_name", Value: lastName }] : []),
          ...(companyName ? [{ Name: "custom:companyName", Value: companyName }] : []),
          { Name: "custom:status", Value: "PENDING" }
        ],
        temporaryPassword: tempPassword,
        sendWelcomeEmail: false // We'll send our own custom email
      });
      
      if (!cognitoUser) {
        throw new Error("Failed to create user in Cognito");
      }

      // Disable the user in Cognito until approved
      await amplifyAuthOperations.disableUser(email);
      
      // Add user to appropriate group ONLY if they're admin
      if (role === "admin") {
        await amplifyAuthOperations.addUserToGroup(email, "GRC-Admin");
      }
      // Don't add to Approved-Users group - they need to be approved first
      
      // Create UserStatus record in DynamoDB with pending status
      const userStatus: UserStatus = {
        id: email,
        email: email,
        status: "pending",
        role: (role as UserStatus["role"]) || "user",
        registrationDate: new Date().toISOString(),
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: performedBy || "system",
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        companyName: companyName || undefined,
      };
      
      await dataOperations.createUserStatus(userStatus);
      
      // Create audit log entry
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_CREATED",
        performedBy: performedBy || "system",
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          role,
          status: "pending",
          createdAt: new Date().toISOString() 
        },
      });
      
      // Send welcome email with temporary password if requested
      if (shouldSendEmail) {
        const emailContent = `
          <h3>Welcome to MC3 GRC Platform!</h3>
          <p>Dear ${firstName || 'User'},</p>
          <p>An account has been created for you on the MC3 GRC platform.</p>
          <p><strong>Your account is currently pending approval.</strong> An administrator will review and approve your account shortly.</p>
          <p>Once approved, you will receive another email with login instructions.</p>
          <p>Best regards,<br>The MC3 Admin Team</p>
        `;
        
        await sendEmailHelper({
          to: email,
          subject: "Welcome to MC3 GRC Platform - Account Pending Approval",
          message: baseTemplate(emailContent),
        });
      }
      
      console.log(`Successfully created user ${email} with pending status`);
      return {
        success: true,
        user: {
          email,
          role,
          firstName,
          lastName,
          companyName,
          status: "pending",
          tempPassword: shouldSendEmail ? undefined : tempPassword, // Only return password if email wasn't sent
        }
      };
    } catch (error) {
      console.error(`Error creating user ${email}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  },

  updateUserRole: async (
    email: string,
    role: string,
    adminEmail: string = "system",
  ): Promise<boolean> => {
    try {
      console.log(`Updating role for user ${email} to ${role} by admin: ${adminEmail}`);
      
      // Update user attributes in Cognito
      await amplifyAuthOperations.updateUserAttributes(email, [
        { Name: "custom:role", Value: role }
      ]);
      
      // Update groups based on role
      const userGroups = await amplifyAuthOperations.getUserGroups(email);
      
      // Remove from GRC-Admin group if changing from admin to user
      if (userGroups.Groups?.some(g => g.GroupName === "GRC-Admin") && role !== "admin") {
        await amplifyAuthOperations.removeUserFromGroup(email, "GRC-Admin");
      }
      
      // Add to GRC-Admin group if changing to admin
      if (role === "admin" && !userGroups.Groups?.some(g => g.GroupName === "GRC-Admin")) {
        await amplifyAuthOperations.addUserToGroup(email, "GRC-Admin");
      }
      
      // Update UserStatus in DynamoDB
      const existingUser = await dataOperations.getUserStatus(email);
      if (existingUser) {
        await dataOperations.updateUserStatus(email, {
          id: email,
          email: email,
          role: role as UserStatus["role"],
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
        });
      } else {
        // Create new UserStatus if it doesn't exist
        await dataOperations.createUserStatus({
          id: email,
          email: email,
          status: "active",
          role: role as UserStatus["role"],
          registrationDate: new Date().toISOString(),
          lastStatusChange: new Date().toISOString(),
          lastStatusChangeBy: adminEmail,
        });
        }
      
      // Create audit log entry
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_ROLE_UPDATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          newRole: role,
          updatedAt: new Date().toISOString() 
        },
      });
      
      console.log(`Successfully updated role for user ${email} to ${role}`);
      return true;
    } catch (error) {
      console.error(`Error updating role for user ${email}:`, error);
      return false;
    }
  },

  updateUserProfile: async (
    email: string,
    firstName?: string,
    lastName?: string,
    companyName?: string,
    adminEmail: string = "system",
  ): Promise<boolean> => {
    try {
      console.log(`Updating profile for user ${email} by admin: ${adminEmail}`);
      
      // Build attributes array for Cognito update
      const attributes: AttributeType[] = [];
      if (firstName !== undefined) {
        attributes.push({ Name: "given_name", Value: firstName });
        attributes.push({ Name: "custom:firstName", Value: firstName });
      }
      if (lastName !== undefined) {
        attributes.push({ Name: "family_name", Value: lastName });
        attributes.push({ Name: "custom:lastName", Value: lastName });
      }
      if (companyName !== undefined) {
        attributes.push({ Name: "custom:companyName", Value: companyName });
      }

      // Update user attributes in Cognito
      if (attributes.length > 0) {
        await amplifyAuthOperations.updateUserAttributes(email, attributes);
      }
      
      // Update UserStatus in DynamoDB
      const existingUser = await dataOperations.getUserStatus(email);
      const updateData: any = {
        id: email,
        email: email,
        lastStatusChange: new Date().toISOString(),
        lastStatusChangeBy: adminEmail,
      };

      if (firstName !== undefined) updateData.firstName = firstName || undefined;
      if (lastName !== undefined) updateData.lastName = lastName || undefined;
      if (companyName !== undefined) updateData.companyName = companyName || undefined;
      
      if (existingUser) {
        await dataOperations.updateUserStatus(email, updateData);
      } else {
        // Create new UserStatus if it doesn't exist
        await dataOperations.createUserStatus({
          ...updateData,
          status: "active",
          role: "user",
          registrationDate: new Date().toISOString(),
        });
      }

      // Create audit log entry
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_PROFILE_UPDATED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: {
          email,
          updatedFields: {
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(companyName !== undefined && { companyName }),
          },
          updatedAt: new Date().toISOString() 
        },
      });
      
      console.log(`Successfully updated profile for user ${email}`);
      return true;
    } catch (error) {
      console.error(`Error updating profile for user ${email}:`, error);
      return false;
    }
  },

  getUserProfile: async (email: string): Promise<string> => {
    try {
      console.log(`Getting profile for user ${email}`);

      // Get user from Cognito
      const cognitoUser = await amplifyAuthOperations.getUser(email);
      if (!cognitoUser) {
        return JSON.stringify({ error: `User ${email} not found` });
      }
      
      // Extract attributes
      const attributes: Record<string, string> = {};
      cognitoUser.UserAttributes?.forEach((attr) => {
        if (attr.Name && attr.Value) attributes[attr.Name] = attr.Value;
      });
      
      // Get UserStatus from DynamoDB
      let dbUser: any = {};
      try {
        const userData = await dataOperations.getUserStatus(email);
        if (userData) dbUser = userData;
      } catch (err) {
        console.warn(`No UserStatus record found for ${email}`);
      }
      
      // Build profile response
      const profile = {
        email,
        firstName: attributes["given_name"] || attributes["custom:firstName"] || dbUser.firstName || "",
        lastName: attributes["family_name"] || attributes["custom:lastName"] || dbUser.lastName || "",
        companyName: attributes["custom:companyName"] || dbUser.companyName || "",
        role: dbUser.role || attributes["custom:role"] || "user",
        status: dbUser.status || "active",
        registrationDate: dbUser.registrationDate || cognitoUser.UserCreateDate?.toISOString(),
        lastLogin: dbUser.lastLogin,
      };
      
      console.log(`Successfully retrieved profile for user ${email}`);
      return JSON.stringify(profile);
    } catch (error) {
      console.error(`Error getting profile for user ${email}:`, error);
      return JSON.stringify({ error: `Failed to get profile for ${email}` });
    }
  },

  getAdminStats: async (): Promise<AdminStats> => {
    try {
      console.log("Fetching admin stats");
      
      // Get all users and count by status
      const allUsers = await dataOperations.listUsersByStatus();
      const userStats = {
        total: allUsers.length,
        active: 0,
        pending: 0,
        rejected: 0,
        suspended: 0,
      };
      
      allUsers.forEach((user: any) => {
        if (user.status && user.status in userStats && user.status !== 'total') {
          userStats[user.status as keyof typeof userStats]++;
        }
      });
      
      // Get recent audit logs
      const auditLogs = await dataOperations.listAuditLogs();
      const recentActivity = auditLogs
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Get 10 most recent
      
      // Return admin stats (assessments would need separate implementation)
      return {
        users: userStats,
        assessments: {
          total: 0,
          inProgress: 0,
          completed: 0,
          compliant: 0,
          nonCompliant: 0,
        },
        complianceRate: 0,
        recentActivity,
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
  },

  getAuditLogs: async (
    dateRange?: { startDate?: string; endDate?: string },
    filters?: {
      action?: string;
      performedBy?: string;
      affectedResource?: string;
    },
  ): Promise<string> => {
    try {
      console.log(`Getting audit logs with filters:`, { dateRange, filters });
      
      // Get all audit logs
      let auditLogs = await dataOperations.listAuditLogs();
      
      // Apply date range filter
      if (dateRange?.startDate || dateRange?.endDate) {
        const startTime = dateRange.startDate ? new Date(dateRange.startDate).getTime() : 0;
        const endTime = dateRange.endDate ? new Date(dateRange.endDate).getTime() : Date.now();
        
        auditLogs = auditLogs.filter((log: any) => {
          const logTime = new Date(log.timestamp).getTime();
          return logTime >= startTime && logTime <= endTime;
        });
      }
      
      // Apply action filter
      if (filters?.action) {
        auditLogs = auditLogs.filter((log: any) => 
          log.action === filters.action
        );
      }
      
      // Apply performedBy filter
      if (filters?.performedBy) {
        auditLogs = auditLogs.filter((log: any) => 
          log.performedBy === filters.performedBy
        );
      }
      
      // Apply affectedResource filter
      if (filters?.affectedResource) {
        auditLogs = auditLogs.filter((log: any) => 
          log.affectedResource === filters.affectedResource
        );
      }

      // Sort by timestamp descending
      auditLogs.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      console.log(`Found ${auditLogs.length} audit logs matching criteria`);
      return JSON.stringify(auditLogs);
    } catch (error) {
      console.error(`Error getting audit logs:`, error);
      return JSON.stringify({ error: `Failed to get audit logs: ${(error as Error).message}` });
    }
  },

  getAllSystemSettings: async (): Promise<string> => {
    try {
      console.log(`Getting all system settings`);
      
      // Get all system settings
      const settings = await dataOperations.listSystemSettings();
      
      // Group settings by category
      const settingsByCategory: Record<string, SystemSetting[]> = {};
      settings.forEach((setting: SystemSetting) => {
        const category = setting.category || "general";
        if (!settingsByCategory[category]) {
          settingsByCategory[category] = [];
        }
        settingsByCategory[category].push(setting);
      });
      
      // Sort settings within each category by name
      Object.keys(settingsByCategory).forEach(category => {
        settingsByCategory[category].sort((a, b) => 
          (a.name || "").localeCompare(b.name || "")
        );
      });
      
      console.log(`Found ${settings.length} system settings`);
      return JSON.stringify({ 
        settings, 
        settingsByCategory 
      });
    } catch (error) {
      console.error(`Error getting system settings:`, error);
      return JSON.stringify({
        settings: [],
        settingsByCategory: {},
        error: `Failed to get system settings: ${(error as Error).message}` 
      });
    }
  },

  updateSystemSettings: async (
    settings: SystemSetting | SystemSetting[],
    updatedBy?: string,
  ): Promise<string> => {
    try {
      const settingsArray = Array.isArray(settings) ? settings : [settings];
      console.log(`Updating ${settingsArray.length} system settings`);
      
      const results = await Promise.all(
        settingsArray.map(async (setting) => {
        try {
            // Check if setting exists
            let existingSetting;
            try {
              existingSetting = await dataOperations.getSystemSettings(setting.id);
            } catch (err) {
              // Setting doesn't exist, will create new
            }
            
            const settingData: SystemSetting = {
              ...setting,
              lastUpdated: new Date().toISOString(),
              updatedBy: updatedBy || "system",
            };
            
            if (existingSetting) {
              await dataOperations.updateSystemSettings(setting.id, settingData);
            } else {
              await dataOperations.createSystemSettings(settingData);
            }
            
            // Create audit log entry
          await createAuditLogEntry({
              timestamp: new Date().toISOString(),
              action: existingSetting ? "SETTING_UPDATED" : "SETTING_CREATED",
            performedBy: updatedBy || "system",
              affectedResource: "systemSetting",
            resourceId: setting.id,
            details: {
                settingName: setting.name,
                settingValue: setting.value,
                category: setting.category,
            },
          });
            
            return { id: setting.id, success: true };
          } catch (error) {
            console.error(`Error updating setting ${setting.id}:`, error);
            return { 
              id: setting.id, 
              success: false, 
              error: (error as Error).message 
            };
        }
        })
      );
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`Successfully updated ${successful} settings, ${failed} failed`);
      return JSON.stringify({
        success: failed === 0,
        results,
        summary: {
          total: results.length,
          successful,
          failed,
        }
      });
    } catch (error) {
      console.error(`Error updating system settings:`, error);
      return JSON.stringify({
        success: false,
        error: `Failed to update system settings: ${(error as Error).message}`,
      });
    }
  },

  deleteUser: async (
    email: string,
    adminEmail: string = "system",
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`Deleting user ${email} by admin: ${adminEmail}`);
      
      // Delete user from Cognito
      await amplifyAuthOperations.deleteUser(email);

      // Update UserStatus in DynamoDB to 'deleted' status
      // Note: We don't actually delete the record to maintain audit trail
      const existingUser = await dataOperations.getUserStatus(email);
      if (existingUser) {
        await dataOperations.updateUserStatus(email, {
        id: email,
        email: email,
          status: "deleted",
          lastStatusChange: new Date().toISOString(),
          lastStatusChangeBy: adminEmail,
          ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days TTL
        });
      }
      
      // Create audit log entry
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USER_DELETED",
        performedBy: adminEmail,
        affectedResource: "user",
        resourceId: email,
        details: { email, deletedAt: new Date().toISOString() },
      });

      console.log(`Successfully deleted user ${email}`);
      return {
        success: true,
        message: `User ${email} has been deleted successfully`,
      };
    } catch (error) {
      console.error(`Error deleting user ${email}:`, error);
      return {
        success: false,
        message: `Failed to delete user: ${(error as Error).message}`,
      };
    }
  },

  migrateUsersToDynamoDB: async (): Promise<{
    success: boolean;
    count: number;
    errors: number;
  }> => {
    try {
      console.log("Starting migration of Cognito users to DynamoDB");
      
      let allCognitoUsers: any[] = [];
      let nextToken: string | undefined = undefined;
      let successCount = 0;
      let errorCount = 0;
      
      // Paginate through all Cognito users
      do {
        const response = await amplifyAuthOperations.listUsers(60, nextToken);
        allCognitoUsers = allCognitoUsers.concat(response.Users || []);
        nextToken = response.PaginationToken;
      } while (nextToken);
      
      console.log(`Found ${allCognitoUsers.length} users in Cognito to migrate`);

      // Process each user
      for (const cognitoUser of allCognitoUsers) {
        try {
        const attributes: Record<string, string> = {};
          cognitoUser.Attributes?.forEach((attr: any) => {
          if (attr.Name && attr.Value) attributes[attr.Name] = attr.Value;
        });

          const email = attributes["email"] || cognitoUser.Username;
        if (!email) {
            console.warn(`Skipping user without email: ${cognitoUser.Username}`);
          errorCount++;
          continue;
        }

          // Check if UserStatus already exists
          try {
            const existingStatus = await dataOperations.getUserStatus(email);
            if (existingStatus) {
              console.log(`UserStatus already exists for ${email}, skipping`);
              continue;
            }
          } catch (err) {
            // UserStatus doesn't exist, we'll create it
          }

          // Create UserStatus record
          const userStatus: UserStatus = {
            id: email,
            email: email,
            status: cognitoUser.Enabled ? "active" : "pending",
            role: (attributes["custom:role"] as UserStatus["role"]) || "user",
            registrationDate: cognitoUser.UserCreateDate?.toISOString() || new Date().toISOString(),
            lastStatusChange: cognitoUser.UserLastModifiedDate?.toISOString() || new Date().toISOString(),
            firstName: attributes["given_name"] || attributes["custom:firstName"] || undefined,
            lastName: attributes["family_name"] || attributes["custom:lastName"] || undefined,
            companyName: attributes["custom:companyName"] || undefined,
          };
          
          await dataOperations.createUserStatus(userStatus);
          console.log(`Successfully migrated user ${email}`);
          successCount++;
          
        } catch (error) {
          console.error(`Error migrating user ${cognitoUser.Username}:`, error);
          errorCount++;
        }
      }

      // Create audit log entry
      await createAuditLogEntry({
        timestamp: new Date().toISOString(),
        action: "USERS_MIGRATED",
        performedBy: "system",
        affectedResource: "users",
        details: {
          totalUsers: allCognitoUsers.length,
          successCount,
          errorCount,
          completedAt: new Date().toISOString() 
        },
      });

      console.log(`Migration completed: ${successCount} successful, ${errorCount} errors`);
      return { 
        success: errorCount === 0, 
        count: successCount, 
        errors: errorCount 
      };
    } catch (error) {
      console.error("Error during user migration:", error);
      return { 
        success: false, 
        count: 0, 
        errors: 1 
      };
    }
  },
};

//console.log("User operations module loaded.");
