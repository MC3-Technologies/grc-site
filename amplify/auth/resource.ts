import { defineAuth } from "@aws-amplify/backend";
import { authTriggersFunction } from "../functions/auth-triggers/resource";
/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "Welcome to MC3's GRC Website!",
      verificationEmailBody: (createCode) => {
        const CODE = createCode();
        const LOGO_URL =
          process.env.LOGO_URL ||
          "https://main.d2xilxp1mil40w.amplifyapp.com/logo-transparent.png";

        return `<!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      .code-box { font-size: 28px; font-weight: bold; letter-spacing: 4px; background:#f5f5f5; padding:12px 24px; display:inline-block; border-radius:6px; }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <img src="${LOGO_URL}" alt="MC3 Technologies Logo" class="logo" />
        <h2>MC3 GRC Platform</h2>
      </div>
      <div class="content">
        <h3>Email Verification</h3>
        <p>Thank you for creating an account with MC3's GRC Platform.</p>
        <p>Please enter the following one-time code to verify your e-mail address:</p>
        <p class="code-box">${CODE}</p>
        <p>This code will expire in 30 minutes. If you did not initiate this request, you can safely ignore this e-mail.</p>
      </div>
      <div class="footer">
        <p>This is an automated message from the MC3 GRC Platform. Please do not reply to this e-mail.</p>
        <p>&copy; ${new Date().getFullYear()} MC3 Technologies. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>`;
      },
    },
  },

  multifactor: {
    mode: "REQUIRED",
    totp: true,
  },

  userAttributes: {
    "custom:role": {
      dataType: "String",
      mutable: true,
    },
    "custom:status": {
      dataType: "String",
      mutable: true,
    },
    "custom:firstName": {
      dataType: "String",
      mutable: true,
    },
    "custom:lastName": {
      dataType: "String",
      mutable: true,
    },
    "custom:companyName": {
      dataType: "String",
      mutable: true,
    },
  },

  groups: ["GRC-Admin", "Approved-Users"],

  triggers: {
    preSignUp: authTriggersFunction,
    postConfirmation: authTriggersFunction,
  },
});
