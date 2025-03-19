// File: amplify/functions/user-management/src/userOperations.ts
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  MessageActionType,
  UserType,
  AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { env } from "$amplify/env/user-management";

// Create clients
const cognito = new CognitoIdentityProviderClient();
const ses = new SESClient();

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
      Source: env.EMAIL_SENDER,
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

// User Operations
export const userOperations = {
  // List all users
  listUsers: async (): Promise<UserData[]> => {
    try {
      const command = new ListUsersCommand({
        UserPoolId: env.AUTH_USERPOOL_ID,
        Limit: 60,
      });

      const response = await cognito.send(command);

      return (response.Users || []).map((user: UserType) => ({
        email: user.Attributes?.find((attr) => attr.Name === "email")?.Value,
        status: user.UserStatus,
        enabled: user.Enabled,
        created: user.UserCreateDate,
        lastModified: user.UserLastModifiedDate,
      }));
    } catch (error) {
      console.error("Error listing users:", error);
      throw error;
    }
  },

  // Get users by status
  getUsersByStatus: async (status: string): Promise<UserData[]> => {
    try {
      const allUsers = await userOperations.listUsers();
      return allUsers.filter((user) => {
        switch (status) {
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
    } catch (error) {
      console.error("Error getting users by status:", error);
      throw error;
    }
  },

  // Get user details
  getUserDetails: async (email: string): Promise<UserData> => {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: env.AUTH_USERPOOL_ID,
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
      throw error;
    }
  },

  // Approve user
  approveUser: async (email: string): Promise<boolean> => {
    try {
      // Add user to appropriate groups
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: env.AUTH_USERPOOL_ID,
        Username: email,
        GroupName: "Approved-Users",
      });

      await cognito.send(addToGroupCommand);

      // Send approval email
      await sendEmail({
        to: email,
        subject: "Your Account Has Been Approved",
        message: `<p>Hello,</p><p>Your account has been approved. You can now log in to the MC3 GRC platform.</p><p>Thank you,<br>MC3 Admin Team</p>`,
      });

      return true;
    } catch (error) {
      console.error(`Error approving user ${email}:`, error);
      return false;
    }
  },

  // Reject user
  rejectUser: async (email: string, reason?: string): Promise<boolean> => {
    try {
      // Disable the user in Cognito
      const disableCommand = new AdminDisableUserCommand({
        UserPoolId: env.AUTH_USERPOOL_ID,
        Username: email,
      });

      await cognito.send(disableCommand);

      // Send rejection email
      const rejectionMessage = `
        <p>Hello,</p>
        <p>We regret to inform you that your account request has been rejected.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ""}
        <p>If you believe this is an error, please contact our support team.</p>
        <p>Thank you,<br>MC3 Admin Team</p>
      `;

      await sendEmail({
        to: email,
        subject: "Your Account Request Status",
        message: rejectionMessage,
      });

      return true;
    } catch (error) {
      console.error(`Error rejecting user ${email}:`, error);
      return false;
    }
  },

  // Suspend user
  suspendUser: async (email: string, reason?: string): Promise<boolean> => {
    try {
      // Disable the user in Cognito
      const disableCommand = new AdminDisableUserCommand({
        UserPoolId: env.AUTH_USERPOOL_ID,
        Username: email,
      });

      await cognito.send(disableCommand);

      // Send suspension email
      const suspensionMessage = `
        <p>Hello,</p>
        <p>Your account has been temporarily suspended.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ""}
        <p>If you believe this is an error, please contact our support team.</p>
        <p>Thank you,<br>MC3 Admin Team</p>
      `;

      await sendEmail({
        to: email,
        subject: "Your Account Has Been Suspended",
        message: suspensionMessage,
      });

      return true;
    } catch (error) {
      console.error(`Error suspending user ${email}:`, error);
      return false;
    }
  },

  // Reactivate user
  reactivateUser: async (email: string): Promise<boolean> => {
    try {
      // Enable the user in Cognito
      const enableCommand = new AdminEnableUserCommand({
        UserPoolId: env.AUTH_USERPOOL_ID,
        Username: email,
      });

      await cognito.send(enableCommand);

      // Send reactivation email
      await sendEmail({
        to: email,
        subject: "Your Account Has Been Reactivated",
        message: `<p>Hello,</p><p>Your account has been reactivated. You can now log in to the MC3 GRC platform.</p><p>Thank you,<br>MC3 Admin Team</p>`,
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
      // Generate a secure temporary password
      const tempPassword = Array(12)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join("");

      // Create user in Cognito
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: env.AUTH_USERPOOL_ID,
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
        // Fix for MessageAction type issue
        MessageAction: sendEmailNotification
          ? ("SEND" as MessageActionType)
          : ("SUPPRESS" as MessageActionType),
      });

      const response = await cognito.send(createCommand);

      // Add to appropriate group
      const groupName = role === "admin" ? "GRC-Admin" : "Approved-Users";

      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: env.AUTH_USERPOOL_ID,
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
};
