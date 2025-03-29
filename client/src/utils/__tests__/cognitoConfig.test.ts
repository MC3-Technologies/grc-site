// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Tests for cognitoConfig.ts

import {
  describe,
  it,
  expect,
  jest,
  afterEach,
  beforeEach,
} from "@jest/globals";

// Mock the dependencies
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

jest.mock('path', () => ({
  resolve: jest.fn(),
}));

// Import fs and path after mocking them
import fs from "fs";
import path from "path";

// Set up process.cwd mock
process.cwd = jest.fn().mockReturnValue('/mock/root/dir');

// Save original process.env
const originalEnv = { ...process.env };

// Mock Vite's import.meta.env correctly
global.import = {
  meta: {
    env: {
      VITE_USER_POOL_ID: undefined,
      VITE_AWS_REGION: undefined,
      VITE_CLIENT_ID: undefined,
    }
  }
};

// Mock window.__VITE_INJECT_ENV for browser environment
const mockWindow = {
  __VITE_INJECT_ENV: {
    VITE_USER_POOL_ID: undefined,
    VITE_AWS_REGION: undefined,
    VITE_CLIENT_ID: undefined,
  }
};

// Set up window for browser environment tests
const originalWindow = global.window;

// Now import the module to test
import { getCognitoConfig } from '../cognitoConfig';

describe("cognitoConfig", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset window
    global.window = undefined;
    
    // Reset environment variables
    process.env = { ...originalEnv };
    
    // Reset import.meta.env
    global.import.meta.env = {
      VITE_USER_POOL_ID: undefined,
      VITE_AWS_REGION: undefined,
      VITE_CLIENT_ID: undefined,
    };
    
    // Reset window.__VITE_INJECT_ENV
    if (mockWindow.__VITE_INJECT_ENV) {
      mockWindow.__VITE_INJECT_ENV.VITE_USER_POOL_ID = undefined;
      mockWindow.__VITE_INJECT_ENV.VITE_AWS_REGION = undefined;
      mockWindow.__VITE_INJECT_ENV.VITE_CLIENT_ID = undefined;
    }
    
    // Set default mocks
    (fs.existsSync).mockReturnValue(false);
    (fs.readFileSync).mockReturnValue("{}");
    (path.resolve).mockImplementation((...args) => args.join('/'));
    
    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore environment
    process.env = { ...originalEnv };
    global.window = originalWindow;
    jest.restoreAllMocks();
  });
  
  describe("getAmplifyConfig", () => {
    it("should return empty object in browser environment", () => {
      // Set up browser environment
      global.window = {};
      
      const config = getCognitoConfig();
      
      // Should return default values since getAmplifyConfig returns empty object
      expect(config.userPoolId).toBe("");
      expect(config.region).toBe("us-east-1"); // Default region
      expect(config.clientId).toBe("");
    });
    
    it("should return empty object when amplify_outputs.json does not exist", () => {
      // Mock fs.existsSync to return false
      (fs.existsSync).mockReturnValue(false);
      
      const config = getCognitoConfig();
      
      // Should return default values
      expect(config.userPoolId).toBe("");
      expect(config.region).toBe("us-east-1"); // Default region
      expect(config.clientId).toBe("");
    });
    
    it("should load values from amplify_outputs.json if it exists", () => {
      // Mock fs.existsSync to return true
      (fs.existsSync).mockReturnValue(true);
      
      // Mock fs.readFileSync to return valid JSON
      (fs.readFileSync).mockReturnValue(JSON.stringify({
        auth: {
          userPoolId: "amplify-user-pool-id",
          region: "amplify-region",
          webClientId: "amplify-client-id",
        }
      }));
      
      const config = getCognitoConfig();
      
      // Should return values from amplify_outputs.json
      expect(config.userPoolId).toBe("amplify-user-pool-id");
      expect(config.region).toBe("amplify-region");
      expect(config.clientId).toBe("amplify-client-id");
    });
    
    it("should handle auth.appClientId if webClientId is not present", () => {
      // Mock fs.existsSync to return true
      (fs.existsSync).mockReturnValue(true);
      
      // Mock fs.readFileSync to return JSON with appClientId
      (fs.readFileSync).mockReturnValue(JSON.stringify({
        auth: {
          userPoolId: "amplify-user-pool-id",
          region: "amplify-region",
          appClientId: "amplify-app-client-id",
        }
      }));
      
      const config = getCognitoConfig();
      
      // Should use appClientId since webClientId is not present
      expect(config.userPoolId).toBe("amplify-user-pool-id");
      expect(config.region).toBe("amplify-region");
      expect(config.clientId).toBe("amplify-app-client-id");
    });
    
    it("should handle errors when reading amplify_outputs.json", () => {
      // Mock fs.existsSync to return true
      (fs.existsSync).mockReturnValue(true);
      
      // Mock fs.readFileSync to throw error
      (fs.readFileSync).mockImplementation(() => {
        throw new Error("File read error");
      });
      
      const config = getCognitoConfig();
      
      // Should return default values
      expect(config.userPoolId).toBe("");
      expect(config.region).toBe("us-east-1");
      expect(config.clientId).toBe("");
      
      // Should log warning
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unable to read Amplify configuration"),
        expect.any(Error)
      );
    });
  });
  
  describe("getEnvConfig", () => {
    it("should use React environment variables if available", () => {
      // Set React environment variables
      process.env.REACT_APP_USER_POOL_ID = "react-user-pool-id";
      process.env.REACT_APP_AWS_REGION = "react-region";
      process.env.REACT_APP_CLIENT_ID = "react-client-id";
      
      const config = getCognitoConfig();
      
      // Should use React environment variables
      expect(config.userPoolId).toBe("react-user-pool-id");
      expect(config.region).toBe("react-region");
      expect(config.clientId).toBe("react-client-id");
    });
    
    it("should use Vite environment variables if available", () => {
      // Set up browser environment
      global.window = {...mockWindow};
      
      // Set Vite environment variables via window.__VITE_INJECT_ENV
      global.window.__VITE_INJECT_ENV = {
        VITE_USER_POOL_ID: "vite-user-pool-id",
        VITE_AWS_REGION: "vite-region",
        VITE_CLIENT_ID: "vite-client-id",
      };
      
      const config = getCognitoConfig();
      
      // Should use Vite environment variables
      expect(config.userPoolId).toBe("vite-user-pool-id");
      expect(config.region).toBe("vite-region");
      expect(config.clientId).toBe("vite-client-id");
    });
    
    it("should prefer Vite environment variables over React environment variables", () => {
      // Set up browser environment
      global.window = {...mockWindow};
      
      // Set both React and Vite environment variables
      process.env.REACT_APP_USER_POOL_ID = "react-user-pool-id";
      process.env.REACT_APP_AWS_REGION = "react-region";
      process.env.REACT_APP_CLIENT_ID = "react-client-id";
      
      // Set Vite environment variables via window.__VITE_INJECT_ENV
      global.window.__VITE_INJECT_ENV = {
        VITE_USER_POOL_ID: "vite-user-pool-id",
        VITE_AWS_REGION: "vite-region",
        VITE_CLIENT_ID: "vite-client-id",
      };
      
      const config = getCognitoConfig();
      
      // Should prefer Vite environment variables
      expect(config.userPoolId).toBe("vite-user-pool-id");
      expect(config.region).toBe("vite-region");
      expect(config.clientId).toBe("vite-client-id");
    });
    
    it("should handle errors in the try block for Vite env variables", () => {
      // Set up browser environment
      global.window = {};
      
      // Make accessing __VITE_INJECT_ENV throw an error
      Object.defineProperty(global.window, '__VITE_INJECT_ENV', {
        get: () => { throw new Error("Cannot access __VITE_INJECT_ENV"); },
      });
      
      const config = getCognitoConfig();
      
      // Should fall back to default values
      expect(config.userPoolId).toBe("");
      expect(config.region).toBe("us-east-1");
      expect(config.clientId).toBe("");
    });
  });
  
  describe("getCognitoConfig", () => {
    it("should log warning when configuration is incomplete", () => {
      // Make sure no config is available
      (fs.existsSync).mockReturnValue(false);
      
      getCognitoConfig();
      
      // Should log warning
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cognito configuration is incomplete")
      );
    });
    
    it("should combine Amplify config and environment variables", () => {
      // Set up Amplify config
      (fs.existsSync).mockReturnValue(true);
      (fs.readFileSync).mockReturnValue(JSON.stringify({
        auth: {
          userPoolId: "amplify-user-pool-id",
          region: "amplify-region",
          webClientId: "amplify-client-id",
        }
      }));
      
      // Set up React environment variables (should take precedence)
      process.env.REACT_APP_USER_POOL_ID = "react-user-pool-id";
      
      const config = getCognitoConfig();
      
      // Should prefer env var for userPoolId
      expect(config.userPoolId).toBe("react-user-pool-id");
      // Should use amplify for the rest
      expect(config.region).toBe("amplify-region");
      expect(config.clientId).toBe("amplify-client-id");
    });
    
    it("should log that it's getting configuration", () => {
      getCognitoConfig();
      
      // Should log
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Getting Cognito configuration")
      );
    });
  });
});
