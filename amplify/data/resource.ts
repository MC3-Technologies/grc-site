// File: amplify/data/resource.ts
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { chatGptFunction } from "../functions/chat-gpt/resource";
import { userManagementFunction } from "../functions/user-management/resource";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  CompletedAssessment: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      completedAt: a.string().required(),
      complianceScore: a.integer().required(),
      isCompliant: a.boolean().required(),
      storagePath: a.string().required(),
      version: a.string().required(),
      duration: a.integer().required(),
    })
    .authorization((allow) => [
      allow.owner().to(["read", "create", "update", "delete"]),
      allow.groups(["GRC-Admin"]).to(["read", "create", "update", "delete"]), // Grant full CRUD to Admins
    ]),
  InProgressAssessment: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      currentPage: a.integer().required(),
      percentCompleted: a.integer().required(),
      storagePath: a.string().required(),
      version: a.string().required(),
      startedAt: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner().to(["read", "create", "update", "delete"]),
      allow.groups(["GRC-Admin"]).to(["read", "create", "update", "delete"]), // Grant full CRUD to Admins
    ]),
  gptCompletion: a
    .query()
    .arguments({
      messages: a.json(),
    })
    .returns(a.json())
    .handler(a.handler.function(chatGptFunction))
    .authorization((allow) => [allow.authenticated("userPools")]),

  UserStatus: a
    .model({
      id: a.id().required(),
      email: a.string().required(),
      status: a.enum(["pending", "active", "suspended", "rejected"]),
      role: a.enum(["user", "admin"]),
      lastLogin: a.string(),
      registrationDate: a.string().required(),
      notes: a.string(),
      rejectionReason: a.string(),
      suspensionReason: a.string(),
      approvedBy: a.string(),
      lastStatusChange: a.string(),
      lastStatusChangeBy: a.string(),
      nickname: a.string(),
    })
    .secondaryIndexes((index) => [
      index("status")
        .sortKeys(["registrationDate"]) // helpful to query recent users per status
        .name("status-index"),
    ])
    .authorization((allow) => [
      allow.groups(["GRC-Admin"]).to(["read", "create", "update", "delete"]),
    ]),

  // User management queries and mutations
  listUsers: a
    .query()
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  getUsersByStatus: a
    .query()
    .arguments({
      status: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  getUserDetails: a
    .query()
    .arguments({
      email: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  getAdminStats: a
    .query()
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  approveUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      adminEmail: a.string(),
    })
    .returns(a.boolean())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  rejectUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      reason: a.string(),
      adminEmail: a.string(),
    })
    .returns(a.boolean())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  suspendUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      reason: a.string(),
      adminEmail: a.string(),
    })
    .returns(a.boolean())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  reactivateUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      adminEmail: a.string(),
    })
    .returns(a.boolean())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  createUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      role: a.string().required(),
      sendEmail: a.boolean(),
      adminEmail: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  updateUserRole: a
    .mutation()
    .arguments({
      email: a.string().required(),
      role: a.string().required(),
      adminEmail: a.string(),
    })
    .returns(a.boolean())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  deleteUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      adminEmail: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  // Admin Dashboard endpoints
  // File: amplify/data/resource.ts

  AuditLog: a
    .model({
      id: a.id().required(),
      timestamp: a.string().required(),
      action: a.string().required(),
      performedBy: a.string().required(),
      affectedResource: a.string().required(),
      resourceId: a.string(),
      details: a.json(),
    })
    .secondaryIndexes((index) => [
      index("performedBy").sortKeys(["timestamp"]).name("performedBy"),
    ])
    .authorization((allow: any) => [
      allow.groups(["GRC-Admin"]).to(["read", "create"]),
    ]),

  SystemSettings: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      value: a.json().required(),
      description: a.string(),
      category: a.string(),
      lastUpdated: a.string(),
      updatedBy: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["GRC-Admin"]).to(["read", "create", "update"]),
    ]),

  getAuditLogs: a
    .query()
    .arguments({
      dateRange: a.json(),
      filters: a.json(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  getAllSystemSettings: a
    .query()
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  updateSystemSettingsConfig: a
    .mutation()
    .arguments({
      settings: a.json().required(),
      updatedBy: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),

  migrateUsersToDynamoDB: a
    .mutation()
    .returns(a.json())
    .authorization((allow) => [allow.groups(["GRC-Admin"])])
    .handler(a.handler.function(userManagementFunction)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam",
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
