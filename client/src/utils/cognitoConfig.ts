// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Utility module to retrieve Cognito configuration
 * from environment variables or configuration files
 */
import fs from "fs";
import path from "path";

interface CognitoConfig {
  userPoolId: string;
  region: string;
  clientId: string;
}

// Try to load Amplify outputs if available
function getAmplifyConfig(): Partial<CognitoConfig> {
  try {
    // In browser environment, we can't access the file system directly
    if (typeof window !== "undefined") {
      return {};
    }

    // Try to locate and read amplify_outputs.json
    const rootDir = process.cwd();
    const amplifyOutputsPath = path.resolve(rootDir, "amplify_outputs.json");

    if (fs.existsSync(amplifyOutputsPath)) {
      const outputsJson = JSON.parse(
        fs.readFileSync(amplifyOutputsPath, "utf8"),
      );

      // Extract Cognito details from the outputs
      if (outputsJson.auth) {
        const auth = outputsJson.auth;
        return {
          userPoolId: auth.userPoolId,
          region: auth.region,
          clientId: auth.webClientId || auth.appClientId,
        };
      }
    }
    return {};
  } catch (e) {
    console.warn("Unable to read Amplify configuration from file system:", e);
    return {};
  }
}

// Get configuration from environment variables (Vite/React)
function getEnvConfig(): Partial<CognitoConfig> {
  // Get Vite environment variables if they exist
  let viteUserPoolId = "";
  let viteRegion = "";
  let viteClientId = "";

  // Check for Vite env vars in a browser-safe way
  if (typeof window !== "undefined") {
    try {
      // Access window.__VITE_INJECT_ENV in a safer way
      const viteEnv = window.__VITE_INJECT_ENV;
      if (viteEnv) {
        viteUserPoolId = viteEnv.VITE_USER_POOL_ID || "";
        viteRegion = viteEnv.VITE_AWS_REGION || "";
        viteClientId = viteEnv.VITE_CLIENT_ID || "";
      }
    } catch (error) {
      // No action needed - we'll fall back to process.env
      console.error("Error accessing Vite environment variables:", error);
    }
  }

  return {
    userPoolId: viteUserPoolId || process.env.REACT_APP_USER_POOL_ID || "",
    region: viteRegion || process.env.REACT_APP_AWS_REGION || "",
    clientId: viteClientId || process.env.REACT_APP_CLIENT_ID || "",
  };
}

// Retrieve configuration with a smart fallback strategy
export function getCognitoConfig(): CognitoConfig {
  // Try to get config from Amplify outputs
  const amplifyConfig = getAmplifyConfig();

  // Get config from environment variables
  const envConfig = getEnvConfig();

  // Merge configs, with environment variables taking precedence
  const config: CognitoConfig = {
    userPoolId: envConfig.userPoolId || amplifyConfig.userPoolId || "",
    region: envConfig.region || amplifyConfig.region || "us-east-1",
    clientId: envConfig.clientId || amplifyConfig.clientId || "",
  };

  // Log a warning if essential values are missing
  if (!config.userPoolId || !config.clientId) {
    console.warn(
      "Cognito configuration is incomplete. Please ensure USER_POOL_ID and CLIENT_ID are set " +
        "in your environment variables or Amplify configuration.",
    );
  }

  return config;
}
