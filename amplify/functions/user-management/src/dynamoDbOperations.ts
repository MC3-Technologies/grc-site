import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  ScanCommand, 
  QueryCommand 
} from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Get table name from environment (Amplify sets these automatically)
const getUserStatusTableName = () => {
  // // Log all environment variables for debugging
  // console.log("Looking for UserStatus table. Available env vars:", 
  //   Object.keys(process.env).filter(key => 
  //     key.includes('TABLE') || key.includes('USER') || key.includes('STATUS')
  //   )
  // );
  
  // Look for table name in various possible environment variables
  const possibleVars = [
    'USERSTATUS_TABLE_NAME',
    'UserStatus_TABLE_NAME',
    'UserStatusTable',
    'AMPLIFY_DATA_USERSTATUS_TABLE_NAME',
    'data_USERSTATUS_TABLE_NAME'
  ];
  
  for (const varName of possibleVars) {
    if (process.env[varName]) {
      //console.log(`Found UserStatus table name in ${varName}: ${process.env[varName]}`);
      return process.env[varName];
    }
  }
  
  // Fallback: construct table name based on stack name pattern
  // Try to get from Lambda function name or other environment variables
  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME || '';
  //console.log(`Lambda function name: ${functionName}`);
  
  // Extract stack identifier from function name
  // Format is usually: amplify-grcsite3-<branch>-<hash>-userManagementFu-<id>
  const stackMatch = functionName.match(/amplify-[^-]+-([^-]+)-([^-]+)/);
  if (stackMatch) {
    const branch = stackMatch[1];
    const hash = stackMatch[2];
    const tableName = `UserStatus-${hash}-${branch}`;
    //console.log(`Constructed UserStatus table name: ${tableName}`);
    return tableName;
  }
  
  // Last resort fallback
  const fallback = 'UserStatus-NONE-NONE';
  //console.log(`Using fallback UserStatus table name: ${fallback}`);
  return fallback;
};

const getAuditLogTableName = () => {
  console.log("Looking for AuditLog table. Available env vars:", 
    Object.keys(process.env).filter(key => 
      key.includes('TABLE') || key.includes('AUDIT') || key.includes('LOG')
    )
  );
  
  const possibleVars = [
    'AUDITLOG_TABLE_NAME',
    'AuditLog_TABLE_NAME',
    'AuditLogTable',
    'AMPLIFY_DATA_AUDITLOG_TABLE_NAME',
    'data_AUDITLOG_TABLE_NAME'
  ];
  
  for (const varName of possibleVars) {
    if (process.env[varName]) {
      //console.log(`Found AuditLog table name in ${varName}: ${process.env[varName]}`);
      return process.env[varName];
    }
  }
  
  // Fallback: construct table name based on stack name pattern
  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME || '';
  const stackMatch = functionName.match(/amplify-[^-]+-([^-]+)-([^-]+)/);
  if (stackMatch) {
    const branch = stackMatch[1];
    const hash = stackMatch[2];
    const tableName = `AuditLog-${hash}-${branch}`;
    //console.log(`Constructed AuditLog table name: ${tableName}`);
    return tableName;
  }
  
  const fallback = 'AuditLog-NONE-NONE';
  //console.log(`Using fallback AuditLog table name: ${fallback}`);
  return fallback;
};

const getSystemSettingsTableName = () => {
  // Look for table name in various possible environment variables
  const possibleVars = [
    'SYSTEMSETTINGS_TABLE_NAME',
    'SystemSettings_TABLE_NAME',
    'SystemSettingsTable',
    'AMPLIFY_DATA_SYSTEMSETTINGS_TABLE_NAME',
    'data_SYSTEMSETTINGS_TABLE_NAME'
  ];
  
  for (const varName of possibleVars) {
    if (process.env[varName]) {
      //console.log(`Found SystemSettings table name in ${varName}: ${process.env[varName]}`);
      return process.env[varName];
    }
  }
  
  // If not found, construct based on pattern from other tables
  throw new Error('SystemSettings table name not found in environment variables');
};

export const dynamoDbOperations = {
  // UserStatus operations
  async createUserStatus(userStatus: any) {
    const tableName = getUserStatusTableName();
    //console.log(`Creating user status in table: ${tableName}`);
    
    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: {
          ...userStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __typename: 'UserStatus'
        }
      });
      
      await docClient.send(command);
      return userStatus;
    } catch (error) {
      console.error(`Failed to create user status in ${tableName}:`, error);
      throw error;
    }
  },

  async getUserStatus(email: string) {
    const tableName = getUserStatusTableName();
    
    try {
      const command = new GetCommand({
        TableName: tableName,
        Key: { id: email }
      });
      
      const result = await docClient.send(command);
      return result.Item;
    } catch (error) {
      console.error(`Failed to get user status from ${tableName}:`, error);
      throw error;
    }
  },

  async updateUserStatus(id: string, updates: any) {
    const tableName = getUserStatusTableName();
    
    // Remove id from updates as it's the key
    const { id: _, ...updateData } = updates;
    
    // Build update expression
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    // Filter out undefined values and build update expression
    Object.entries(updateData).forEach(([key, value], index) => {
      // Skip undefined values - DynamoDB doesn't allow updating to undefined
      if (value !== undefined) {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        
        updateExpressionParts.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });
    
    // Always update the updatedAt field
    const updatedAtIndex = Object.keys(updateData).length;
    updateExpressionParts.push(`#attr${updatedAtIndex} = :val${updatedAtIndex}`);
    expressionAttributeNames[`#attr${updatedAtIndex}`] = 'updatedAt';
    expressionAttributeValues[`:val${updatedAtIndex}`] = new Date().toISOString();
    
    // If no fields to update (only updatedAt), return early
    if (updateExpressionParts.length === 1) {
      //console.log('No fields to update for user status');
      return { id };
    }
    
    try {
      const command = new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });
      
      const result = await docClient.send(command);
      return result.Attributes;
    } catch (error) {
      console.error(`Failed to update user status in ${tableName}:`, error);
      throw error;
    }
  },

  async listUsersByStatus(status?: string) {
    const tableName = getUserStatusTableName();
    
    try {
      if (status) {
        // Use GSI to query by status
        const command = new QueryCommand({
          TableName: tableName,
          IndexName: 'status-index',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': status
          }
        });
        
        const result = await docClient.send(command);
        return result.Items || [];
      } else {
        // Scan all items
        const command = new ScanCommand({
          TableName: tableName
        });
        
        const result = await docClient.send(command);
        return result.Items || [];
      }
    } catch (error) {
      console.error(`Failed to list users by status from ${tableName}:`, error);
      // If table doesn't exist, return empty array instead of throwing
      if (error instanceof Error && error.name === 'ResourceNotFoundException') {
        console.warn(`Table ${tableName} not found, returning empty array`);
        return [];
      }
      throw error;
    }
  },

  async deleteUserStatus(id: string) {
    const tableName = getUserStatusTableName();
    
    try {
      const command = new DeleteCommand({
        TableName: tableName,
        Key: { id }
      });
      
      await docClient.send(command);
      return { id };
    } catch (error) {
      console.error(`Failed to delete user status from ${tableName}:`, error);
      throw error;
    }
  },

  // AuditLog operations
  async createAuditLog(auditLog: any) {
    const tableName = getAuditLogTableName();
    
    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: {
          ...auditLog,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __typename: 'AuditLog'
        }
      });
      
      await docClient.send(command);
      return auditLog;
    } catch (error) {
      console.error(`Failed to create audit log in ${tableName}:`, error);
      throw error;
    }
  },

  async listAuditLogs() {
    const tableName = getAuditLogTableName();
    
    try {
      const command = new ScanCommand({
        TableName: tableName
      });
      
      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error(`Failed to list audit logs from ${tableName}:`, error);
      if (error instanceof Error && error.name === 'ResourceNotFoundException') {
        console.warn(`Table ${tableName} not found, returning empty array`);
        return [];
      }
      throw error;
    }
  },

  // SystemSettings operations
  async getSystemSettings(id: string) {
    const tableName = getSystemSettingsTableName();
    const command = new GetCommand({
      TableName: tableName,
      Key: { id },
    });
    const response = await docClient.send(command);
    return response.Item;
  },

  async listSystemSettings() {
    const tableName = getSystemSettingsTableName();
    const command = new ScanCommand({
      TableName: tableName,
    });
    const response = await docClient.send(command);
    return response.Items || [];
  },

  async createSystemSettings(settings: any) {
    const tableName = getSystemSettingsTableName();
    const command = new PutCommand({
      TableName: tableName,
      Item: settings,
    });
    await docClient.send(command);
    return settings;
  },

  async updateSystemSettings(id: string, updates: any) {
    const tableName = getSystemSettingsTableName();
    
    // Build update expression
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    Object.keys(updates).forEach((key, index) => {
      if (key !== 'id' && updates[key] !== undefined) {
        const placeholder = `#attr${index}`;
        const valuePlaceholder = `:val${index}`;
        updateExpressionParts.push(`${placeholder} = ${valuePlaceholder}`);
        expressionAttributeNames[placeholder] = key;
        expressionAttributeValues[valuePlaceholder] = updates[key];
      }
    });
    
    if (updateExpressionParts.length === 0) {
      return { id }; // Nothing to update
    }
    
    const command = new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });
    
    const response = await docClient.send(command);
    return response.Attributes;
  },
}; 