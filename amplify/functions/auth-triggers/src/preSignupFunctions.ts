import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
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
  `[AuthTriggerConfig] Using UserStatus Table Name: ${process.env.USER_STATUS_TABLE || process.env.USER_STATUS_TABLE_NAME || "UserStatus-jvvqiyl2bfghrnbjzog3hwam3y-NONE (Hardcoded Fallback!)"}`,
);
console.log(
  `[AuthTriggerConfig] Using User Pool ID (from env): ${amplifyEnv.USER_POOL_ID || process.env.USER_POOL_ID || "NOT SET IN ENV"}`,
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
    try {
      console.log(`[START] createPendingUserStatus for ${email}`);
      // Log the raw profileData argument received
      console.log(
        `[createPendingUserStatus] Received profileData argument:`,
        JSON.stringify(profileData || {}, null, 2),
      );

      // Ensure profileData exists and provide fallbacks directly in the data object
      const fName = profileData?.firstName || undefined; // Use undefined as fallback
      const lName = profileData?.lastName || undefined;
      const cName = profileData?.companyName || undefined;
      console.log(
        `[createPendingUserStatus] Profile data received: firstName=${fName}, lastName=${lName}, companyName=${cName}`,
      );

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

      // Log the data that will be written to DynamoDB
      console.log(
        `[createPendingUserStatus] UserStatus data to be written:`,
        JSON.stringify(userStatusData),
      );

      // Get table name - try both environment variable formats to ensure compatibility
      const tableName =
        process.env.USER_STATUS_TABLE ||
        process.env.USER_STATUS_TABLE_NAME ||
        "UserStatus-jvvqiyl2bfghrnbjzog3hwam3y-NONE"; // Hardcoded fallback as last resort

      console.log(
        `[createPendingUserStatus] Using DynamoDB table: ${tableName}`,
      );

      if (!tableName || tableName === "") {
        console.error(
          "❌ [createPendingUserStatus] USER_STATUS_TABLE environment variable is not set or is empty! Using fallback.",
        );
        return false;
      }

      // Write directly to DynamoDB with better error handling
      try {
        const putCommand = new PutCommand({
          TableName: tableName,
          Item: userStatusData, // Pass the raw JS object here
        });

        console.log(
          `[createPendingUserStatus] Sending PutCommand to DynamoDB table: ${tableName}...`,
        );
        await docClient.send(putCommand);
        console.log(
          `✅ [createPendingUserStatus] Successfully created UserStatus record for ${email} with pending status`,
        );
        return true;
      } catch (dbError: any) {
        // Log specific DynamoDB error details
        console.error(
          `❌ [createPendingUserStatus] DynamoDB error creating UserStatus for ${email}. Table: ${tableName}`,
          dbError,
        );
        // Log more details if available
        console.error(
          `Error Details: Name: ${dbError?.name}, Code: ${dbError?.$metadata?.httpStatusCode || "N/A"}, Message: ${dbError?.message}, Full Error: ${JSON.stringify(dbError)}`,
        );

        // If we get a ResourceNotFoundException, the table might not exist
        if (
          dbError?.name === "ResourceNotFoundException" ||
          dbError?.__type?.includes("ResourceNotFoundException")
        ) {
          console.error(
            `Table "${tableName}" not found. Please check if the table exists and is accessible.`,
          );
        }

        return false;
      }
    } catch (error: any) {
      console.error(
        `❌ [createPendingUserStatus] Outer error for ${email}:`,
        error,
      );
      // If this is not critical for the sign-up flow, we can continue
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

      console.log("Attempting to send admin notification email:", {
        to: ADMIN_EMAIL,
        from: FROM_EMAIL,
        subject: "New User Registration - Action Required",
      });

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
        console.log("SES send result:", JSON.stringify(result, null, 2));
        console.log(
          `Admin notification email sent successfully for new user: ${userEmail}`,
        );
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
      console.error(
        `Error notifying admin about new user ${userEmail}:`,
        error,
      );
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
        console.log(`Application review email sent to user: ${userEmail}`);
        return true;
      } catch (emailError) {
        console.error("Error sending application review email:", emailError);
        return false;
      }
    } catch (error) {
      console.error(
        `Error sending application review email to ${userEmail}:`,
        error,
      );
      return false;
    }
  },
};
