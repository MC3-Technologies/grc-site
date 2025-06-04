import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../data/resource";

// For Lambda resolvers in the data stack, we need to check if we're running
// in an AppSync context or standalone
const isAppSyncResolver =
  !!process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.API_ENDPOINT;

if (!isAppSyncResolver) {
  // Only configure Amplify if we're not running as an AppSync resolver
  const graphqlEndpoint = process.env.API_ENDPOINT;

  if (graphqlEndpoint) {
    console.log("Configuring Amplify with GraphQL endpoint:", graphqlEndpoint);

    Amplify.configure({
      API: {
        GraphQL: {
          endpoint: graphqlEndpoint,
          region: process.env.AWS_REGION!,
          defaultAuthMode: "iam",
        },
      },
    });
  } else {
    console.warn("API_ENDPOINT not set - running as AppSync resolver");
  }
}

// Create the Amplify Data client with IAM auth mode for server-side operations
// When running as an AppSync resolver, the context is automatically provided
export const dataClient = generateClient<Schema>({
  authMode: "iam",
});

// Helper functions for common data operations
export const amplifyDataOperations = {
  // UserStatus operations
  async createUserStatus(userStatus: any) {
    const result = await dataClient.models.UserStatus.create(userStatus);
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to create user status: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async getUserStatus(email: string) {
    const result = await dataClient.models.UserStatus.get({ id: email });
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Failed to get user status: ${result.errors[0].message}`);
    }
    return result.data;
  },

  async updateUserStatus(id: string, updates: any) {
    const result = await dataClient.models.UserStatus.update({
      id,
      ...updates,
    });
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to update user status: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async deleteUserStatus(id: string) {
    const result = await dataClient.models.UserStatus.delete({ id });
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to delete user status: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async listUsersByStatus(status?: string) {
    if (status) {
      const result = await dataClient.models.UserStatus.list({
        filter: {
          status: {
            eq: status,
          },
        },
      });
      if (result.errors && result.errors.length > 0) {
        throw new Error(
          `Failed to list users by status: ${result.errors[0].message}`,
        );
      }
      return result.data;
    } else {
      const result = await dataClient.models.UserStatus.list();
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Failed to list users: ${result.errors[0].message}`);
      }
      return result.data;
    }
  },

  // AuditLog operations
  async createAuditLog(auditLog: any) {
    const result = await dataClient.models.AuditLog.create(auditLog);
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to create audit log: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async listAuditLogs() {
    const result = await dataClient.models.AuditLog.list();
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Failed to list audit logs: ${result.errors[0].message}`);
    }
    return result.data;
  },

  // Assessment operations
  async listCompletedAssessments() {
    const result = await dataClient.models.CompletedAssessment.list();
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to list completed assessments: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async listInProgressAssessments() {
    const result = await dataClient.models.InProgressAssessment.list();
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to list in-progress assessments: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async getCompletedAssessment(id: string) {
    const result = await dataClient.models.CompletedAssessment.get({ id });
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to get completed assessment: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async getInProgressAssessment(id: string) {
    const result = await dataClient.models.InProgressAssessment.get({ id });
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to get in-progress assessment: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  // SystemSettings operations
  async getSystemSettings(id: string) {
    const result = await dataClient.models.SystemSettings.get({ id });
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to get system settings: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async listSystemSettings() {
    const result = await dataClient.models.SystemSettings.list();
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to list system settings: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async createSystemSettings(settings: any) {
    const result = await dataClient.models.SystemSettings.create(settings);
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to create system settings: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },

  async updateSystemSettings(id: string, updates: any) {
    const result = await dataClient.models.SystemSettings.update({
      id,
      ...updates,
    });
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to update system settings: ${result.errors[0].message}`,
      );
    }
    return result.data;
  },
};
