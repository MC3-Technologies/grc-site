// Email templates for various user management actions

interface TemplateData {
  [key: string]: string;
}

// The URL where your logo is publicly accessible
const LOGO_URL =
  process.env.LOGO_URL ||
  "https://main.d2xilxp1mil40w.amplifyapp.com/logo-transparent.png";

// Base template that all emails will use
const baseTemplate = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .logo { max-width: 150px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    .button { display: inline-block; background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${LOGO_URL}" alt="MC3 Technologies Logo" class="logo" />
      <h2>MC3 GRC Platform</h2>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from the MC3 GRC Platform. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} MC3. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// Template for user approval emails
export const approvalTemplate = (data: TemplateData = {}): string => {
  const content = `
    <h3>Welcome to MC3 GRC Platform!</h3>
    <p>Dear User,</p>
    <p>We're pleased to inform you that your account has been approved. You now have access to the MC3 GRC platform.</p>
    <p><strong>Next steps:</strong></p>
    <ol>
      <li>Log in to your account using your registered email address</li>
      <li>Set up your profile and preferences</li>
      <li>Explore the platform features</li>
    </ol>
    <p>If you need any assistance, please contact our support team.</p>
    <p>Thank you for choosing MC3 GRC Platform!</p>
    <p>Best regards,<br>The MC3 Admin Team</p>
  `;

  return baseTemplate(content);
};

// Template for user rejection emails
export const rejectionTemplate = (data: TemplateData = {}): string => {
  const content = `
    <h3>Account Application Status</h3>
    <p>Dear User,</p>
    <p>Thank you for your interest in the MC3 GRC Platform.</p>
    <p>After reviewing your application, we regret to inform you that we are unable to approve your account at this time.</p>
    ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
    <p>If you believe this decision was made in error or if you have additional information that might support your application, please contact our support team.</p>
    <p>Best regards,<br>The MC3 Admin Team</p>
  `;

  return baseTemplate(content);
};

// Template for user suspension emails
export const suspensionTemplate = (data: TemplateData = {}): string => {
  const content = `
    <h3>Account Suspension Notice</h3>
    <p>Dear User,</p>
    <p>We're writing to inform you that your account on the MC3 GRC Platform has been temporarily suspended.</p>
    ${data.reason ? `<p><strong>Reason for suspension:</strong> ${data.reason}</p>` : ""}
    <p>During this suspension period, you will not be able to access your account or use any of the platform services.</p>
    <p>If you have any questions about this suspension or would like to discuss reactivating your account, please contact our support team.</p>
    <p>Best regards,<br>The MC3 Admin Team</p>
  `;

  return baseTemplate(content);
};

// Template for user reactivation emails
export const reactivationTemplate = (data: TemplateData = {}): string => {
  const content = `
    <h3>Your Account Has Been Reactivated</h3>
    <p>Dear User,</p>
    <p>Great news! Your account on the MC3 GRC Platform has been successfully reactivated.</p>
    <p>You can now log in to your account and resume using all the platform features and services.</p>
    <p><strong>Next steps:</strong></p>
    <ol>
      <li>Log in to your account using your registered email address</li>
      <li>Review your profile and preferences</li>
      <li>Resume your activities on the platform</li>
    </ol>
    <p>If you need any assistance or have any questions, please don't hesitate to contact our support team.</p>
    <p>Welcome back to MC3 GRC Platform!</p>
    <p>Best regards,<br>The MC3 Admin Team</p>
  `;

  return baseTemplate(content);
};
