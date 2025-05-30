import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient, ListTablesCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { PutCommand, GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  baseTemplate,
  adminNotificationTemplate,
} from "../../user-management/src/templates/emailTemplates";

// Try to import env variables, fallback to process.env if not available
let amplifyEnv: any;
try {
  // In Amplify Gen 2, this gets resolved during deployment
  amplifyEnv = require("$amplify/env/pre-signup").env;
} catch (error) {
  console.log("Using process.env fallback");
  amplifyEnv = process.env;
}

// --- Log resolved configuration ---
console.log(
  `[AuthTriggerConfig] Running in Lambda function: ${process.env.AWS_LAMBDA_FUNCTION_NAME}`,
);
console.log(
  `[AuthTriggerConfig] Will discover UserStatus table dynamically at runtime`,
);
console.log(
  `[AuthTriggerConfig] Using User Pool ID (from env): ${amplifyEnv.USER_POOL_ID || process.env.USER_POOL_ID || "Will be provided at runtime"}`,
); // Log pool ID if available
console.log(
  `[AuthTriggerConfig] Resolved ADMIN_EMAIL: ${amplifyEnv.ADMIN_EMAIL || process.env.ADMIN_EMAIL || "cmmc.support@mc3technologies.com"}`,
);
console.log(
  `[AuthTriggerConfig] Resolved FROM_EMAIL: ${amplifyEnv.EMAIL_SENDER || process.env.EMAIL_SENDER || amplifyEnv.FROM_EMAIL || process.env.FROM_EMAIL || "no-reply-grc@mc3technologies.com"}`,
);
// --------------------------------

// Initialize clients
const cognito = new CognitoIdentityProviderClient();
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient();

// Cache for table name to avoid repeated lookups
let cachedUserStatusTableName: string | null = null;

/**
 * Dynamically discovers the UserStatus table name
 * Tables created by Amplify Gen 2 follow the pattern: UserStatus-<hash>-<environment>
 */
async function getUserStatusTableName(): Promise<string> {
  console.log("[getUserStatusTableName] Starting discovery...");
  if (cachedUserStatusTableName) {
    console.log(`[getUserStatusTableName] Returning cached table name: ${cachedUserStatusTableName}`);
    return cachedUserStatusTableName;
  }

  try {
    // First try environment variables
    const envTableName = process.env.USER_STATUS_TABLE || process.env.USER_STATUS_TABLE_NAME;
    console.log(`[getUserStatusTableName] Environment variables: USER_STATUS_TABLE=${process.env.USER_STATUS_TABLE}, USER_STATUS_TABLE_NAME=${process.env.USER_STATUS_TABLE_NAME}`);
    if (envTableName) {
      console.log(`[getUserStatusTableName] Found table name in environment: ${envTableName}`);
      cachedUserStatusTableName = envTableName;
      return envTableName;
    }
    console.log("[getUserStatusTableName] Table name not in environment, attempting discovery via ListTables...");

    // If not in env, discover it by listing tables
    const listTablesCommand = new ListTablesCommand({});
    const response = await dynamoClient.send(listTablesCommand);
    console.log(`[getUserStatusTableName] ListTables response: ${JSON.stringify(response.TableNames)}`);
    
    const candidateTables = (response.TableNames || []).filter((name) =>
      name.startsWith("UserStatus-")
    );

    if (candidateTables.length > 0) {
      let newestTable = candidateTables[0];
      let newestTime = 0;

      for (const tableName of candidateTables) {
        try {
          const desc = await dynamoClient.send(
            new DescribeTableCommand({ TableName: tableName })
          );
          const created = desc.Table?.CreationDateTime?.getTime() || 0;
          if (created > newestTime) {
            newestTime = created;
            newestTable = tableName;
          }
        } catch (err) {
          console.warn(
            `[getUserStatusTableName] DescribeTable failed for ${tableName}:`,
            err
          );
        }
      }

      cachedUserStatusTableName = newestTable;
      console.log(
        `[getUserStatusTableName] Selected newest UserStatus table: ${newestTable}`
      );
      return newestTable;
    }

    // Fallback to a known table name if discovery fails
    const fallbackTable = "UserStatus-jvvqiyl2bfghrnbjzog3hwam3y-NONE"; // This should ideally not be used
    console.warn(`[getUserStatusTableName] Could not discover UserStatus table via ListTables, using fallback: ${fallbackTable}`);
    cachedUserStatusTableName = fallbackTable;
    return fallbackTable;
  } catch (error) {
    console.error("[getUserStatusTableName] Error discovering UserStatus table:", error);
    // Use fallback
    const fallbackTable = "UserStatus-jvvqiyl2bfghrnbjzog3hwam3y-NONE";
    console.warn(`[getUserStatusTableName] Error occurred, using fallback: ${fallbackTable}`);
    cachedUserStatusTableName = fallbackTable;
    return fallbackTable;
  }
}

// Admin email - Could be stored in environment variables
const ADMIN_EMAIL =
  amplifyEnv.ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "cmmc.support@mc3technologies.com";
const FROM_EMAIL =
  amplifyEnv.EMAIL_SENDER ||
  process.env.EMAIL_SENDER ||
  amplifyEnv.FROM_EMAIL ||
  process.env.FROM_EMAIL ||
  "no-reply-grc@mc3technologies.com";

// Log email configuration for debugging
console.log("Email configuration:", {
  ADMIN_EMAIL,
  FROM_EMAIL,
  amplifyEnvAdminEmail: amplifyEnv.ADMIN_EMAIL,
  processEnvAdminEmail: process.env.ADMIN_EMAIL,
  amplifyEnvEmailSender: amplifyEnv.EMAIL_SENDER,
  processEnvEmailSender: process.env.EMAIL_SENDER,
  amplifyEnvFromEmail: amplifyEnv.FROM_EMAIL,
  processEnvFromEmail: process.env.FROM_EMAIL,
});

// Define minimal UserStatus interface needed here
interface UserStatus {
  id: string; // email
  email: string;
  status: "pending" | "active" | "suspended" | "rejected" | "deleted";
  role: "user" | "admin";
  firstName?: string;
  lastName?: string;
  companyName?: string;
  registrationDate: string;
  lastLogin?: string;
  notes?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  approvedBy?: string;
  lastStatusChange?: string;
  lastStatusChangeBy?: string;
  ttl?: number;
}

// User status operations
export const userStatusOperations = {
  /**
   * Gets a user status record from the UserStatus table
   * @param email The user's email address
   * @returns Promise<any> The user status record or null if not found
   */
  getUserStatus: async (email: string): Promise<any> => {
    try {
      const tableName = await getUserStatusTableName();
      console.log(`[getUserStatus] Using table: ${tableName} for email: ${email}`);

      const getCommand = new GetCommand({
        TableName: tableName,
        Key: {
          id: email,
        },
      });

      const response = await docClient.send(getCommand);
      return response.Item || null;
    } catch (error) {
      console.error(`[getUserStatus] Error for ${email}:`, error);
      return null;
    }
  },

  /**
   * Creates a new user status record in the UserStatus table
   * Creates a new user status record in the UserStatus table, including profile data if provided.
   * @param email The user's email address
   * @param profileData Optional object containing firstName, lastName, companyName
   * @returns Promise<boolean> Success status
   */
  createPendingUserStatus: async (
    email: string,
    profileData?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    },
  ): Promise<boolean> => {
    console.log(`[createPendingUserStatus] Attempting to create record for ${email} with profile: ${JSON.stringify(profileData)}`);
    try {
      const tableName = await getUserStatusTableName();
      console.log(`[createPendingUserStatus] Using table: ${tableName} for email: ${email}`);

      // Ensure profileData exists and provide fallbacks directly in the data object
      const fName = profileData?.firstName || undefined; // Use undefined as fallback
      const lName = profileData?.lastName || undefined;
      const cName = profileData?.companyName || undefined;

      // Set up user with pending status and profile data in UserStatus table
      const userStatusData: Partial<UserStatus> = {
        id: email, // Partition Key
        email: email,
        status: "pending", // Default status on creation
        role: "user", // Default role on creation
        registrationDate: new Date().toISOString(),
        // Add profile data if it exists
        firstName: fName,
        lastName: lName,
        companyName: cName,
        // Ensure these are explicitly undefined/null if not set
        lastLogin: undefined,
        notes: undefined,
        rejectionReason: undefined,
        suspensionReason: undefined,
        approvedBy: undefined,
        lastStatusChange: undefined,
        lastStatusChangeBy: undefined,
        ttl: undefined,
      };
      console.log(`[createPendingUserStatus] Data to write: ${JSON.stringify(userStatusData)}`);

      // Reject if we are still using the hard-coded fallback (means discovery failed)
      if (!tableName || tableName === "UserStatus-jvvqiyl2bfghrnbjzog3hwam3y-NONE") {
        console.error(`[createPendingUserStatus] Invalid or fallback table name: ${tableName}. Aborting PutCommand.`);
        return false;
      }

      try {
        const putCommand = new PutCommand({
          TableName: tableName,
          Item: userStatusData,
        });
        await docClient.send(putCommand);
        console.log(`[createPendingUserStatus] Successfully created UserStatus record for ${email} in table ${tableName}`);
        return true;
      } catch (dbError: any) {
        console.error(`[createPendingUserStatus] DynamoDB error for ${email} in table ${tableName}:`, dbError);
        return false;
      }
    } catch (error: any) {
      console.error(`[createPendingUserStatus] Outer error for ${email}:`, error);
      return false;
    }
  },

  /**
   * Sends a notification to admin(s) about a new user signup
   * @param userEmail The email of the user who signed up
   * @returns Promise<boolean> Success status
   */
  notifyAdminsAboutNewUser: async (userEmail: string): Promise<boolean> => {
    try {
      // Use the admin notification template
      const emailContent = adminNotificationTemplate({
        userEmail,
        adminUrl: amplifyEnv.ADMIN_URL || process.env.ADMIN_URL || "#",
      });

      //console.log("Attempting to send admin notification email:", {
      //  to: ADMIN_EMAIL,
      //  from: FROM_EMAIL,
      //  subject: "New User Registration - Action Required",
      //});

      // Use direct SES sending instead of centralized function for better error visibility
      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [ADMIN_EMAIL],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: emailContent,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "New User Registration - Action Required",
          },
        },
        Source: FROM_EMAIL,
      });

      try {
        const result = await sesClient.send(command);
        //console.log("SES send result:", JSON.stringify(result, null, 2));
        //console.log(
        //  `Admin notification email sent successfully for new user: ${userEmail}`,
        //);
        return true;
      } catch (sesError) {
        console.error("SES Error details:", {
          message:
            sesError instanceof Error ? sesError.message : String(sesError),
          code: (sesError as any)?.Code,
          name: sesError instanceof Error ? sesError.name : undefined,
          stack: sesError instanceof Error ? sesError.stack : undefined,
        });

        // Email sending failed
        console.warn("Email sending failed");
        return false;
      }
    } catch (error) {
      //console.error(
      //  `Error notifying admin about new user ${userEmail}:`,
      //  error,
      //);
      return false;
    }
  },

  /**
   * Sends a notification to the user about their application being in review
   * @param userEmail The email of the user who signed up
   * @returns Promise<boolean> Success status
   */
  sendApplicationReviewEmail: async (userEmail: string): Promise<boolean> => {
    try {
      const content = `
        <h1>Application Under Review</h1>
        <p>Dear User,</p>
        <p>Thank you for creating an account with MC3's GRC Platform.</p>
        <p>Your application is currently under review by our administrators. You will receive a notification once your application has been approved or rejected.</p>
        <p>If you have any questions, please contact our support team at ${FROM_EMAIL}.</p>
        <p>Thank you for your patience.</p>
        <p>MC3 GRC Team</p>
      `;

      const params = {
        Destination: {
          ToAddresses: [userEmail],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: baseTemplate(content),
            },
            Text: {
              Charset: "UTF-8",
              Data: `Application Under Review: Thank you for creating an account with MC3's GRC Platform. Your application is currently under review by our administrators. You will receive a notification once your application has been approved or rejected.`,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "Your MC3 GRC Platform Application Status",
          },
        },
        Source: FROM_EMAIL,
      };

      // Attempt to send email
      try {
        const command = new SendEmailCommand(params);
        await sesClient.send(command);
        //console.log(`Application review email sent to user: ${userEmail}`);
        return true;
      } catch (emailError) {
        //console.error("Error sending application review email:", emailError);
        return false;
      }
    } catch (error) {
      //console.error(
      //  `Error sending application review email to ${userEmail}:`,
      //  error,
      //);
      return false;
    }
  },
};
