/**
 * @jest-environment node
 * @jest-environment-options {"skipExporting": true}
 */

// Set up Jest mocks for testing
import { Model } from "survey-core";
import { MockClient, __resetMockClient } from "../../__mocks__/amplify-client";
import { __resetMockStorage } from "../../__mocks__/aws-amplify/storage";
import { __resetMockAuth } from "../../__mocks__/aws-amplify/auth";
import { __resetMockCognito } from "../../__mocks__/@aws-sdk/client-cognito-identity-provider";
import { __resetMockSES } from "../../__mocks__/@aws-sdk/client-ses";
import { __resetMockDynamoDB } from "../../__mocks__/@aws-sdk/client-dynamodb";

// Create a test version of the assessment utility that uses mocks
import { surveyJson } from "../../assessmentQuestions";

// Mock the schema module
jest.mock("../../amplify/schema", () => ({
  getClientSchema: jest.fn(() => MockClient),
}));

// Mock the storage module
jest.mock("aws-amplify/storage", () => {
  const storage = jest.requireActual("../../__mocks__/aws-amplify/storage");
  return storage;
});

// Mock the auth module
jest.mock("aws-amplify/auth", () => {
  const auth = jest.requireActual("../../__mocks__/aws-amplify/auth");
  return auth;
});

// Mock AWS SDK Cognito client
jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  return jest.requireActual(
    "../../__mocks__/@aws-sdk/client-cognito-identity-provider",
  );
});

// Mock AWS SDK SES client
jest.mock("@aws-sdk/client-ses", () => {
  return jest.requireActual("../../__mocks__/@aws-sdk/client-ses");
});

// Mock AWS SDK DynamoDB client
jest.mock("@aws-sdk/client-dynamodb", () => {
  return jest.requireActual("../../__mocks__/@aws-sdk/client-dynamodb");
});

// Mock AWS SDK util-dynamodb
jest.mock("@aws-sdk/util-dynamodb", () => {
  return jest.requireActual("../../__mocks__/@aws-sdk/util-dynamodb");
});

// Create test data helpers
export const createTestAssessmentFile = (
  data = {},
  filename = "test-assessment.json",
) => {
  // Create a Model instance with the survey JSON and merge with any provided data
  const model = new Model(surveyJson);
  if (Object.keys(data).length > 0) {
    model.data = data;
  }

  // Convert to JSON string
  const jsonString = JSON.stringify(model.data, null, 2);

  // Create a file object
  const blob = new Blob([jsonString], { type: "application/json" });
  return new File([blob], filename, { type: "application/json" });
};

// Reset all mocks before each test - safely handle missing functions
export const resetAllMocks = () => {
  // Safely reset each mock, handling cases where a reset function might be undefined
  const safeReset = (resetFn: unknown) => {
    if (typeof resetFn === 'function') {
      try {
        resetFn();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Error resetting mock: ${errorMessage}`);
      }
    }
  };

  safeReset(__resetMockClient);
  safeReset(__resetMockStorage);
  safeReset(__resetMockAuth);
  safeReset(__resetMockCognito);
  safeReset(__resetMockSES);
  safeReset(__resetMockDynamoDB);
};
