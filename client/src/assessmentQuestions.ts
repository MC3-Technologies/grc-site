const surveyJson = {
  showProgressBar: "topBottom",
  progressBarType: "buttons",
  showTOC: true,
  tocLocation: "left",
  goNextPageAutomatic: false,
  showNavigationButtons: true,
  showPageTitles: true,
  showQuestionNumbers: "off",
  checkErrorsMode: "onValueChanged",
  requiredText: "*",
  questionErrorLocation: "bottom",
  maxTextLength: 4000,
  maxOthersLength: 1000,
  isPaneless: true,
  title: "CMMC Level 1 Assessment",
  pages: [
    {
      title: "Section 1 - Onboarding Section",
      elements: [
        {
          name: "employee_count",
          title: "How many employees do you have?",
          type: "text",
          isRequired: true,
        },
        {
          name: "expansion_plan",
          title: "Do you plan to expand?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "expansion_timeline",
          title: "If yes, what is the timeline?",
          type: "text",
          isRequired: true,
          visibleIf: "{expansion_plan} = 'yes'",
        },
        {
          name: "business_industry",
          title: "What industry does your business belong to?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "health", text: "Health" },
            { value: "sales", text: "Sales" },
            { value: "commerce", text: "Commerce" },
            { value: "other", text: "Other" },
          ],
        },
        {
          name: "it_policies",
          title: "Do you have any IT related policies and/or procedures?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "policies_review",
          title: "If yes, how often are they reviewed and/or updated?",
          type: "text",
          isRequired: true,
          visibleIf: "{it_policies} = 'yes'",
        },
        {
          name: "policies_used",
          title: "If yes, select those used in your organization:",
          type: "checkbox",
          isRequired: true,
          visibleIf: "{it_policies} = 'yes'",
          choices: [
            {
              value: "new_employee_handbook",
              text: "New Employee Handbook / Guide",
            },
            { value: "aup", text: "Acceptable Use Policy (AUP)" },
            { value: "password_policy", text: "Password Policy" },
            { value: "ir", text: "IR" },
            { value: "pci_dss", text: "PCI-DSS" },
            { value: "hipaa", text: "HIPAA" },
            { value: "gdpr", text: "GDPR" },
            { value: "other", text: "Other (List all)" },
          ],
        },
        {
          name: "it_infrastructure",
          title: "Do you have on-prem or managed IT infrastructure?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "onprem", text: "On-prem" },
            { value: "managed", text: "Managed" },
            { value: "none", text: "None" },
          ],
        },
        {
          name: "active_directory",
          title: "Do you have Active Directory?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "remote_access",
          title:
            "Do employees have remote access to company resources to perform their work?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
      ],
    },
    {
      name: "Access Control",
      elements: [
        {
          type: "radiogroup",
          name: "inventoryUsers",
          title:
            "Do you maintain an updated inventory of all users, admin, service, and device accounts?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "inventoryDevices",
          title:
            "Do you maintain an updated inventory of all devices and systems that connect to the network?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "inventoryConnections",
          title:
            "Do you maintain an updated list of connections to external systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "verifyConnections",
          title: "Are connections to external systems verified and controlled?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "uniqueUserAccounts",
          title:
            "Do all employees have unique user accounts for accessing company systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "accessRestriction",
          title:
            "Are employees, devices, systems, and processes granted access only to the systems and data they need for their job role?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "documentedPolicy",
          title: "Are these documented in policy?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "separatedAccounts",
          title:
            "Are admin or privileged accounts separated from standard user accounts?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "uniqueAdminPasswords",
          title: "Are passwords for admin accounts unique and not shared?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "protectAccountDetails",
          title:
            "Do you protect account details like usernames and passwords from unauthorized access (e.g., no passwords on sticky notes or in excel documents)?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "publicInformation",
          title:
            "Do you have externally accessible public information? Ie website, blog, social media?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "externalPostingPolicy",
          title:
            "Do you have policy and training on posting or processing information on external publicly available systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "inventoryPublicUsers",
          title:
            "Do you maintain an inventory of users authorized to post or process information on publicly accessible systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "reviewProcessPublicContent",
          title:
            "Do you maintain a review process prior to posting any publicly accessible content?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "ensureFCI",
          title:
            "Does this include ensuring FCI is not included in publicly posted data?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "removeFCI",
          title: "Do you have processes to remove improperly posted FCI?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
      ],
    },
    {
      name: "Identification & Authentication (IA)",
      elements: [
        {
          type: "radiogroup",
          name: "useMFA",
          title:
            "Do you use Multi-Factor Authentication (MFA) for accessing company systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "strongPasswords",
          title:
            "Do you enforce strong passwords (e.g., 14+ characters or longest allowed)?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "enforcePasswordPolicy",
          title: "Is your password policy enforced across all company assets?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
      ],
    },
    {
      name: "Media Protection (MP)",
      elements: [
        {
          type: "comment",
          name: "assetDisposal",
          title:
            "How do you dispose of outdated company assets (e.g., computers, hard drives)?",
          isRequired: true,
        },
        {
          type: "comment",
          name: "sanitizeMedia",
          title: "How do you sanitize media before release for reuse?",
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "shredDocuments",
          title:
            "Do you shred or securely destroy documents containing sensitive business information?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
      ],
    },
    {
      name: "Physical Protection (PE)",
      elements: [
        {
          type: "radiogroup",
          name: "physicalSecurityMeasures",
          title:
            "Do you have an authorization list(s) and physical security measures in place to prevent unauthorized access to organizational systems, equipment, and operating environments such as workstations, file storage, or server rooms?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "companySecurityMeasures",
          title:
            "What security measures are used at company locations? (e.g., locks, keycards, alarms, cameras)",
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "visitorMonitoring",
          title:
            "Are visitors logged, escorted and monitored while within security perimeters?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "accessEquipmentControl",
          title:
            "Is physical security access equipment identified, controlled, and managed?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
      ],
    },
    {
      name: "System & Communications Protection (SC)",
      elements: [
        {
          type: "radiogroup",
          name: "identifyBoundaries",
          title:
            "Do security policies identify external and key internal system boundaries?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "monitorBoundaries",
          title:
            "Are external boundaries monitored, controlled, and protected?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "useSecurityProtections",
          title:
            "Do you use security protections such as firewalls, antivirus, or endpoint security tools?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "encryptData",
          title:
            "Do you encrypt sensitive company data when storing or transmitting it?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "backupProtection",
          title:
            "If you perform backups, are they protected (e.g., encrypted, stored securely)?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "regularUpdates",
          title:
            "Do you ensure that systems are regularly updated with security patches?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "websiteDataHandling",
          title:
            "If your company has a website, do you handle sensitive customer or business data on it?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "separatePublicInternal",
          title:
            "Are publicly accessible websites logically or physically separated from internal networks?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "publicWifi",
          title:
            "Do you have publicly accessible WiFi or Network ports in publicly accessible areas outside of physical security perimeters, i.e. lobby, waiting room?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "identifyMaliciousCodeProtection",
          title:
            "Do you identify systems or network locations requiring malicious code protection?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "separatePublicNetwork",
          title:
            "Are publicly accessible websites, or networks logically or physically separated from internal networks?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
      ],
    },
    {
      name: "System & Information Integrity (SI)",
      elements: [
        {
          type: "radiogroup",
          name: "useIntrusionDetection",
          title:
            "Do you use Intrusion Detection/Prevention, antivirus, and/or endpoint protection tools on company computers and systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "realTimeMaliciousCode",
          title:
            "Do these systems perform real-time malicious code scans of files from external sources as they are downloaded, opened, or executed?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "patchMonitoring",
          title:
            "Do you monitor for and install security patches and updates for all systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "defineScanFrequency",
          title: "Do you define a frequency for malicious code scans?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "meetScanFrequency",
          title:
            "Do you meet the defined frequency for malicious code scanning?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "reviewLogs",
          title:
            "Do you review system logs or security alerts for potential security issues?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "policyTimeFrames",
          title:
            "Does security policy identify time frames to identify, report, and remediate system flaws?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "meetTimeFrames",
          title:
            "Do you meet the time frames to identify, report, and remediate system flaws?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
      ],
    },
    {
      name: "Supply Chain Management",
      elements: [
        {
          type: "radiogroup",
          name: "farContractProvisions",
          title:
            "Do you include FAR contract provisions in contracts with sub-contractors?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "validateSubcontractorCompliance",
          title:
            "Do you validate subcontractor CMMC or applicable security compliance as a contingent requirement for selection?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "fcisharingPolicies",
          title:
            "Do you include policies and processes to ensure FCI is not shared with subcontractors, suppliers or manufacturers without validating CMMC or other applicable security framework compliance?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
      ],
    },
  ],
};

export { surveyJson };
