// File: amplify/functions/user-management/handler.ts
import { userOperations } from "./src/userOperations";
import type { Schema } from "../../data/resource";
import { AppSyncResolverEvent } from "aws-lambda";

// Define a type for AppSync-specific fields
type AppSyncEvent = AppSyncResolverEvent<any, any> & {
  typeName?: string;
  fieldName?: string;
  info?: {
    fieldName?: string;
  };
};

/**
 * Handler for the user management function
 * Following the pattern established in chat-gpt function
 */
export const handler = async (event: AppSyncResolverEvent<any, any>) => {
  try {
    console.log("User management handler received event:", JSON.stringify(event, null, 2));
    
    // Determine the operation (improved logic)
    let operation = '';
    let args = {};
    
    // Cast event to our extended type for AppSync-specific properties
    const appSyncEvent = event as AppSyncEvent;
    
    // Check if typeName and fieldName exist (AppSync resolver pattern)
    if (appSyncEvent.typeName && appSyncEvent.fieldName) {
      console.log(`Event has typeName: ${appSyncEvent.typeName} and fieldName: ${appSyncEvent.fieldName}`);
      operation = appSyncEvent.fieldName;
      args = appSyncEvent.arguments || {};
    }
    // Fallback checks for older patterns
    else if (typeof event === 'object' && event !== null) {
      if ('operation' in event) {
        operation = (event as any).operation;
      } else if ('field' in event) {
        operation = (event as any).field;
      } else if ('info' in event && appSyncEvent.info && 'fieldName' in appSyncEvent.info) {
        operation = appSyncEvent.info.fieldName || '';
      } else if ('path' in event) {
        // Extract operation from path if possible
        const path = (event as any).path;
        const parts = typeof path === 'string' ? path.split('/') : [];
        operation = parts[parts.length - 1] || 'listUsers';
      } else {
        console.warn("Could not determine operation from event structure, defaulting to listUsers");
        operation = 'listUsers';
      }
      
      // Get arguments
      args = ((event as any).arguments || (event as any).args || {});
    }
    
    console.log(`Executing operation: ${operation} with args:`, args);
    
    // Execute the operation
    return await executeOperation(operation, args, event);
  } catch (error) {
    console.error("Error in Lambda handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};

async function executeOperation(operation: string, args: Record<string, any>, event: AppSyncResolverEvent<any, any>) {
  try {
    // Execute the operation using the user operation module
    // Using switch pattern similar to chat-gpt handler
    switch (operation) {
      case "listUsers":
        return await userOperations.listUsers();
        
      case "getUsersByStatus":
        if (!args.status) {
          return JSON.stringify({ error: "Status parameter is required" });
        }
        return await userOperations.getUsersByStatus(args.status);
        
      case "getUserDetails":
        if (!args.email) {
          return JSON.stringify({ error: "Email parameter is required" });
        }
        return await userOperations.getUserDetails(args.email);
        
      case "approveUser":
        if (!args.email) {
          return JSON.stringify({ error: "Email parameter is required" });
        }
        return JSON.stringify(await userOperations.approveUser(args.email));
        
      case "rejectUser":
        if (!args.email) {
          return JSON.stringify({ error: "Email parameter is required" });
        }
        return JSON.stringify(await userOperations.rejectUser(args.email, args.reason));
        
      case "suspendUser":
        if (!args.email) {
          return JSON.stringify({ error: "Email parameter is required" });
        }
        return JSON.stringify(await userOperations.suspendUser(args.email, args.reason));
        
      case "reactivateUser":
        if (!args.email) {
          return JSON.stringify({ error: "Email parameter is required" });
        }
        return JSON.stringify(await userOperations.reactivateUser(args.email));
        
      case "createUser":
        if (!args.email || !args.role) {
          return JSON.stringify({ error: "Email and role parameters are required" });
        }
        return JSON.stringify(await userOperations.createUser(args.email, args.role, args.sendEmail));
        
      case "updateUserRole":
        if (!args.email || !args.role) {
          return JSON.stringify({ error: "Email and role parameters are required" });
        }
        return JSON.stringify(await userOperations.updateUserRole(args.email, args.role));
        
      default:
        console.log(`Unknown operation: ${operation}, defaulting to listUsers`);
        return await userOperations.listUsers();
    }
  } catch (error) {
    console.error("Error in user management handler:", error);
    
    // Always return a valid JSON response even on error
    return JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      users: [] // Ensure there's always a users property for client compatibility
    });
  }
}