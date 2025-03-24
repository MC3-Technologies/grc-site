import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { baseTemplate } from "../../user-management/src/templates/emailTemplates";

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
const snsClient = new SNSClient();

// Admin email - Could be stored in environment variables
const ADMIN_EMAIL =
  amplifyEnv.ADMIN_EMAIL || "cmmc.support@mc3technologies.com";
const FROM_EMAIL = amplifyEnv.FROM_EMAIL || "cmmc.support@mc3technologies.com";

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
      const content = `
        <h1>New User Registration</h1>
        <p>A new user has registered with the email: <strong>${userEmail}</strong></p>
        <p>This user is awaiting approval. Please login to the admin panel to approve or reject this user.</p>
        <p><a href="${amplifyEnv.ADMIN_URL || "#"}">Go to Admin Panel</a></p>
      `;

      const params = {
        Destination: {
          ToAddresses: [ADMIN_EMAIL],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: baseTemplate(content),
            },
            Text: {
              Charset: "UTF-8",
              Data: `New User Registration: A new user has registered with the email: ${userEmail}. This user is awaiting approval. Please login to the admin panel to approve or reject this user.`,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "New User Registration - Action Required",
          },
        },
        Source: FROM_EMAIL,
      };

      // Log the email parameters for debugging
      console.log("Sending admin notification with params:", {
        to: ADMIN_EMAIL,
        from: FROM_EMAIL,
        subject: params.Message.Subject.Data,
      });

      // Attempt to send email
      try {
        const command = new SendEmailCommand(params);
        await sesClient.send(command);
        console.log(`Admin notification email sent for new user: ${userEmail}`);
        return true;
      } catch (emailError) {
        console.error("Error sending admin notification email:", emailError);
        
        // Log more details about the error
        if (emailError instanceof Error) {
          console.error("Error details:", {
            message: emailError.message,
            stack: emailError.stack,
            name: emailError.name
          });
        }

        // Fallback to SNS if email fails
        try {
          const snsParams = {
            Message: `New user registration: ${userEmail} is pending approval.`,
            Subject: "New User Registration",
            TopicArn: amplifyEnv.ADMIN_NOTIFICATION_TOPIC_ARN,
          };

          if (amplifyEnv.ADMIN_NOTIFICATION_TOPIC_ARN) {
            const snsCommand = new PublishCommand(snsParams);
            await snsClient.send(snsCommand);
            console.log(`Admin SNS notification sent for new user: ${userEmail}`);
            return true;
          } else {
            console.warn("SNS Topic ARN not configured, skipping SNS notification");
            return false;
          }
        } catch (snsError) {
          console.error("Error sending SNS notification:", snsError);
          return false;
        }
      }
    } catch (error) {
      console.error(`Error notifying admin about new user ${userEmail}:`, error);
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
