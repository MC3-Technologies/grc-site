# User Management Testing Documentation

## Table of Contents

1. [Overview](#overview)
2. [Mocking Strategy](#mocking-strategy)
3. [Test Coverage](#test-coverage)
4. [Setup Instructions](#setup-instructions)
5. [Best Practices](#best-practices)

## Overview

This documentation describes the unit testing approach implemented for the user management module to enable testing without incurring AWS charges. The solution creates mock implementations of AWS services (Cognito, SES, DynamoDB), allowing thorough testing of user management logic without making actual API calls to AWS.

## Mocking Strategy

### Core Components Mocked

The testing framework mocks three key AWS service categories:

1. **AWS Cognito Identity Provider**:
   - Location: `client/src/__mocks__/@aws-sdk/client-cognito-identity-provider.ts`
   - Purpose: Mocks user management operations (create, read, update, delete users and groups)
   - Features: In-memory user storage with helper methods for test setup

2. **AWS Simple Email Service (SES)**:
   - Location: `client/src/__mocks__/@aws-sdk/client-ses.ts`
   - Purpose: Mocks email sending operations
   - Features: Captures sent emails for verification in tests

3. **AWS DynamoDB**:
   - Location: `client/src/__mocks__/@aws-sdk/client-dynamodb.ts`
   - Purpose: Mocks database operations for audit logs and system settings
   - Features: In-memory tables with support for basic query and scan operations

4. **DynamoDB Utilities**:
   - Location: `client/src/__mocks__/@aws-sdk/util-dynamodb.ts`
   - Purpose: Mocks DynamoDB marshalling/unmarshalling utilities
   - Features: Converts between JavaScript objects and DynamoDB attribute format

### Mock Implementation Details

#### 1. AWS Cognito Mock

The Cognito mock implementation:

- Creates in-memory Maps to store user data and group memberships
- Implements all necessary Cognito commands (AdminCreateUser, AdminGetUser, etc.)
- Simulates group membership operations
- Provides helper methods for test setup (`__setMockUser`, `__getMockUser`, etc.)

#### 2. SES Mock

The SES mock:

- Captures all outgoing emails in memory
- Implements SendEmailCommand
- Provides helper methods (`__getMockSentEmails`, `__getLastSentEmail`)
- Returns mock message IDs

#### 3. DynamoDB Mock

The DynamoDB mock:

- Uses Map objects to store table data in memory
- Implements PutItem, Query, and Scan operations
- Supports basic filtering in queries
- Provides helper methods for test setup (`__setMockTable`, `__getMockTable`)

### Integration with Tests

The mocks are integrated with the tests through:

1. **Jest Module Mocking**: Each AWS SDK module is mocked using Jest's module mocking system
2. **Helper Functions**: Each mock provides helper functions for setting up test data
3. **Reset Functions**: Each mock has reset functions to clear test data between tests

## Test Coverage

The test suite covers the following user management functionality:

### User Operations Tests

1. **User Listing and Filtering**
   - Retrieving all users
   - Filtering users by status (PENDING, APPROVED, etc.)
   - Fetching detailed user information

2. **User Status Management**
   - Approving pending users
   - Rejecting user applications
   - Suspending active users
   - Reactivating suspended users

3. **User Creation and Modification**
   - Creating new users
   - Updating user roles
   - Deleting users

4. **Admin Functions**
   - Retrieving admin statistics
   - Managing system settings
   - Viewing audit logs

### Handler Tests

Tests for the Lambda handler cover:

- Proper routing of AppSync operations to the right userOperations functions
- Parameter passing
- Error handling
- Response formatting

### Utility Tests

Utility tests cover:

- Logging functions
- ID generation
- Email validation

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Running Tests

1. Run the entire test suite:

   ```bash
   npm test
   ```

2. Run tests for a specific file:

   ```bash
   npm test -- amplify/functions/user-management/__tests__/userOperations.test.ts
   ```

3. Run tests with coverage:
   ```bash
   npm test -- --coverage
   ```

### Setting Up New Tests

To create new tests that use the mocking infrastructure:

1. Import mock helpers:

   ```typescript
   import {
     __setMockUser,
     __getMockUser,
   } from "../../../client/src/__mocks__/@aws-sdk/client-cognito-identity-provider";
   ```

2. Reset mocks in `beforeEach`:

   ```typescript
   beforeEach(() => {
     __resetMockCognito();
     __resetMockSES();
     __resetMockDynamoDB();
   });
   ```

3. Set up test data:

   ```typescript
   __setMockUser("test@example.com", {
     attributes: {
       email: "test@example.com",
       "custom:status": "APPROVED",
     },
     enabled: true,
   });
   ```

4. Call the function under test and verify results:

   ```typescript
   const result = await userOperations.getUserDetails("test@example.com");
   expect(result.email).toBe("test@example.com");
   ```

## Best Practices

1. **Reset Between Tests**: Always reset all mocks in `beforeEach()` to ensure tests are isolated.

2. **Use Helper Methods**: Use mock helper functions to set up and verify test state.

3. **Cover Edge Cases**: Test both success cases and failure cases, including invalid inputs and error handling.

4. **Verify Side Effects**: Check that operations have the expected side effects (e.g., emails sent, database updates).

5. **Keep Tests Independent**: Each test should set up its own data and not depend on other tests.

6. **Keep Mocks in Sync**: If AWS SDK interfaces change, update the mocks to match the new interfaces.
