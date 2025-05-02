// approveUser.mjs
import { config } from 'dotenv';
import fetch from 'node-fetch';
import pkg from '@aws-sdk/client-cognito-identity-provider';
const { CognitoIdentityProviderClient, InitiateAuthCommand } = pkg;

config(); // Load environment variables

const {
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  COGNITO_USER_POOL_CLIENT_ID,
  APPSYNC_ENDPOINT
} = process.env;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !COGNITO_USER_POOL_CLIENT_ID || !APPSYNC_ENDPOINT) {
  throw new Error("Missing required environment variables");
}

async function getIdToken() {
  const client = new CognitoIdentityProviderClient({ region: 'us-west-1' });

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_USER_POOL_CLIENT_ID,
    AuthParameters: {
      USERNAME: ADMIN_USERNAME,
      PASSWORD: ADMIN_PASSWORD,
    },
  });

  const result = await client.send(command);
  return result.AuthenticationResult.IdToken;
}

async function approveUser() {
  try {
    const token = await getIdToken();

    const mutation = `
      mutation ApproveUser($email: String!, $adminEmail: String) {
        approveUser(email: $email, adminEmail: $adminEmail)
      }
    `;

    const variables = {
      email: "imatar77@hawaii.edu",
      adminEmail: "cmmc.support@mc3technologies.com"
    };

    const response = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const json = await response.json();
    console.log("✅ Mutation Response:", JSON.stringify(json, null, 2));
    console.log("✅ Approval Status:", json?.data?.approveUser ? "Success" : "Failed");
  } catch (err) {
    console.error("❌ Error approving user:", err.message || err);
  }
}

approveUser();
