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

// User status operations
export const userStatusOperations = {
  /**
   * Creates a new user status record in the UserStatus table
   * @param email The user's email address
   * @returns Promise<boolean> Success status
   */
  createPendingUserStatus: async (email: string): Promise<boolean> => {
    try {
      // Set up user with pending status in UserStatus table
      const userStatusData = {
        id: email,
        email: email,
        status: "pending",
        role: "user",
        registrationDate: new Date().toISOString(),
      };

      // Define the table name from environment or default
      const tableName = amplifyEnv.USER_STATUS_TABLE || "UserStatus";

      // Write directly to DynamoDB
      const putCommand = new PutCommand({
        TableName: tableName,
        Item: userStatusData,
      });

      await docClient.send(putCommand);

      console.log(`Created UserStatus record for ${email} with pending status`);

      return true;
    } catch (error) {
      console.error(`Error creating UserStatus for ${email}:`, error);
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
