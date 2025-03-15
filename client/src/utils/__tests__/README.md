# AWS Amplify Testing Documentation

## Table of Contents
1. [Overview](#overview)
2. [Mocking Strategy](#mocking-strategy)
3. [Test Coverage](#test-coverage)
4. [Setup Instructions](#setup-instructions)
5. [Best Practices](#best-practices)

## Overview

This documentation describes the unit testing approach implemented for the assessment module to enable testing without incurring AWS/Amplify charges. The solution creates mock implementations of AWS services, allowing thorough testing of application logic without making actual API calls to AWS.

## Mocking Strategy

### Core Components Mocked

The testing framework mocks three key AWS/Amplify service categories:

1. **AWS Amplify Client (DataStore)**: 
   - Location: `client/src/__mocks__/amplify-client.ts`
   - Purpose: Mocks all database interactions without requiring actual DynamoDB connections

2. **AWS Storage (S3)**:
   - Location: `client/src/__mocks__/aws-amplify/storage.ts`
   - Purpose: Mocks file storage operations (upload, download, delete) using in-memory Maps

3. **AWS Authentication (Cognito)**:
   - Location: `client/src/__mocks__/aws-amplify/auth.ts`
   - Purpose: Mocks user authentication and identity management

4. **Assessment Module**:
   - Location: Direct Jest mock in `assessment.test.ts`
   - Purpose: Provides test-specific implementations of assessment-related methods

### Mock Implementation Details

#### 1. AWS Amplify Client Mock

The mock client implementation:
- Creates in-memory Maps to store assessment data
- Handles CRUD operations (create, read, update, delete)
- Provides helper methods for test setup (`__resetMockClient`, `__setMockInProgressAssessment`, etc.)
- Simulates DataStore behaviors without AWS connections

#### 2. Storage Mock

The storage mock:
- Uses a `Map<string, Blob>` to store file data in memory
- Implements `uploadData`, `downloadData`, and `remove` functions
- Simulates S3 bucket operations locally
- Provides helper methods like `__resetMockStorage` and `__setMockStorageItem`

#### 3. Authentication Mock

The auth mock:
- Simulates user identity with `fetchAuthSession` 
- Returns test identity IDs and tokens
- Provides a helper method `__setMockIdentity` to customize test user identity

#### 4. Assessment Module Mock

The test directly mocks the assessment module with:
- In-memory storage for in-progress and completed assessments
- Full implementations of all assessment methods (create, fetch, update, delete)
- Helper methods for test setup and assertions
- Support for simulating assessment completion workflows

### Setup Integration

All mocks are integrated through the `setup.ts` file, which:
- Configures the Jest test environment
- Applies all required mocks using `jest.mock()`
- Provides utility functions for resetting test state
- Initializes testing helpers

## Test Coverage

The test suite covers the following assessment functionality:

### InProgressAssessment Tests
1. **Creating Assessments**
   - Creating new assessments with proper metadata
   - Verifying generated IDs and timestamps

2. **Fetching Assessments**
   - Retrieving all in-progress assessments
   - Fetching specific assessment data by ID
   - Error handling for non-existent assessments

3. **Updating Assessments**
   - Updating progress information (currentPage, percentCompleted)
   - Ensuring proper timestamps are updated

4. **Deleting Assessments**
   - Removing in-progress assessments
   - Verifying both database and storage deletion

### CompletedAssessment Tests
1. **Fetching Completed Assessments**
   - Retrieving all completed assessments
   - Fetching specific completed assessment data

2. **Completing Assessments**
   - Converting in-progress to completed assessments
   - Verifying completion metadata (compliance score, completion time)

3. **Storage Operations**
   - Testing storage data retrieval
   - Verifying proper file paths and content

4. **Deletion**
   - Removing completed assessments and associated storage

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Verify the Jest configuration:
   - Check that `client/jest.config.js` includes the settings for TypeScript support and path patterns
   - Confirm that `setup.ts` is excluded from test runs with `testPathIgnorePatterns`

### Running Tests

1. Run the entire test suite:
   ```bash
   npm test
   ```

2. Run tests in watch mode (for development):
   ```bash
   npm run test:watch
   ```

3. Run a specific test file:
   ```bash
   npx jest src/utils/__tests__/assessment.test.ts
   ```

### Setting Up New Tests

To create new tests that use the mocking infrastructure:

1. Import helpers from setup:
   ```typescript
   import { resetAllMocks } from './setup';
   ```

2. Import any required mock setup functions:
   ```typescript
   import { __setMockIdentity } from '../../__mocks__/aws-amplify/auth';
   import { __setMockStorageItem } from '../../__mocks__/aws-amplify/storage';
   ```

3. Reset mocks before each test:
   ```typescript
   beforeEach(() => {
     resetAllMocks();
     __setMockIdentity('test-user-id');
   });
   ```

4. Create test data:
   ```typescript
   const testAssessment = {
     id: 'test-id-1',
     name: 'Test Assessment',
     // other required properties
   };
   ```

5. Use helper methods to set up test state:
   ```typescript
   (InProgressAssessment as any).__setMockAssessment(testAssessment);
   ```

## Best Practices

1. **Keep Mocks Updated**: When AWS Amplify models change, update the corresponding mock implementations to match.

2. **Reset State Between Tests**: Always use `resetAllMocks()` in `beforeEach()` to ensure tests are isolated.

3. **Mock Only What's Necessary**: The implementation follows the principle of minimal mocking – only AWS-dependent services are mocked.

4. **Provide Test Helpers**: The `__setMockAssessment` and similar functions make tests readable and maintainable.

5. **Type Safety**: Use proper TypeScript types for mocks to catch type issues early.

6. **Isolated Storage**: Each test should set up its own storage items and not rely on side effects from other tests.

7. **Realistic Test Data**: Create test data that closely resembles real data structures.
 