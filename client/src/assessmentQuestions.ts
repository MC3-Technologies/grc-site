// const surveyJson = {
//   showProgressBar: "topBottom",
//   progressBarType: "buttons",
//   showTOC: true,
//   tocLocation: "left",
//   goNextPageAutomatic: false,
//   showNavigationButtons: true,
//   showPageTitles: true,
//   showQuestionNumbers: "off",
//   checkErrorsMode: "onValueChanged",
//   requiredText: "*",
//   questionErrorLocation: "bottom",
//   maxTextLength: 4000,
//   maxOthersLength: 1000,
//   isPaneless: true,
//   title: "CMMC Level 1 Assessment",
//   pages: [
//     {
//       title: "Section 1 - Onboarding Section",
//       elements: [
//         {
//           name: "employee_count",
//           title: "How many employees do you have?",
//           type: "text",
//           isRequired: true,
//         },
//         {
//           name: "expansion_plan",
//           title: "Do you plan to expand?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "expansion_timeline",
//           title: "If yes, what is the timeline?",
//           type: "text",
//           isRequired: true,
//           visibleIf: "{expansion_plan} = 'yes'",
//         },
//         {
//           name: "business_industry",
//           title: "What industry does your business belong to?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "health", text: "Health" },
//             { value: "sales", text: "Sales" },
//             { value: "commerce", text: "Commerce" },
//             { value: "other", text: "Other" },
//           ],
//         },
//         {
//           name: "it_policies",
//           title: "Do you have any IT related policies and/or procedures?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "policies_review",
//           title: "If yes, how often are they reviewed and/or updated?",
//           type: "text",
//           isRequired: true,
//           visibleIf: "{it_policies} = 'yes'",
//         },
//         {
//           name: "policies_used",
//           title: "If yes, select those used in your organization:",
//           type: "checkbox",
//           isRequired: true,
//           visibleIf: "{it_policies} = 'yes'",
//           choices: [
//             {
//               value: "new_employee_handbook",
//               text: "New Employee Handbook / Guide",
//             },
//             { value: "aup", text: "Acceptable Use Policy (AUP)" },
//             { value: "password_policy", text: "Password Policy" },
//             { value: "ir", text: "IR" },
//             { value: "pci_dss", text: "PCI-DSS" },
//             { value: "hipaa", text: "HIPAA" },
//             { value: "gdpr", text: "GDPR" },
//             { value: "other", text: "Other (List all)" },
//           ],
//         },
//         {
//           name: "it_infrastructure",
//           title: "Do you have on-prem or managed IT infrastructure?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "onprem", text: "On-prem" },
//             { value: "managed", text: "Managed" },
//             { value: "none", text: "None" },
//           ],
//         },
//         {
//           name: "active_directory",
//           title: "Do you have Active Directory?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "remote_access",
//           title:
//             "Do employees have remote access to company resources to perform their work?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 2 - Access",
//       elements: [
//         {
//           name: "inventory_accounts",
//           title: "Do you maintain an updated inventory of all accounts?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "account_change_process",
//           title:
//             "Do you have a process to secure user account credential changes (password, username change)?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "unique_employee_accounts",
//           title:
//             "Does each employee have a unique account and access only to the company resources they need for their role?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "privileged_accounts",
//           title:
//             "Do you have separate accounts for Privileged or Admin Accounts?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "admin_password",
//           title: "Does each Admin account have a separate password?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "mfa_usage",
//           title: "Do you utilize Multi-Factor-Authentication (MFA)?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "sso_usage",
//           title: "Do you use Single-Sign-On (SSO) for any of your systems?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "account_details_protected",
//           title:
//             "Do you ensure that account details like usernames and passwords are protected from misuse?",
//           type: "radiogroup",
//           isRequired: true,
//           description: "Example: Posted on a sticky note next to the computer",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 3 - Asset Management",
//       elements: [
//         {
//           name: "hw_sw_inventory",
//           title: "Do you keep an inventory of company HW and SW assets?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "asset_inventory_updated",
//           title: "If yes: Is your asset inventory updated regularly?",
//           type: "radiogroup",
//           isRequired: true,
//           visibleIf: "{hw_sw_inventory} = 'yes'",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "asset_usage_agreement",
//           title:
//             "Do employees sign an agreement on the proper use of company assets?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "assets_shared",
//           title: "Are any assets shared between employees?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "asset_disposal",
//           title:
//             "How do you dispose of assets when they reach their end of life (EOL)?",
//           type: "comment",
//           isRequired: true,
//         },
//         {
//           name: "sensitive_data_handling",
//           title: "How do you handle sensitive data?",
//           type: "comment",
//           isRequired: true,
//           description: "Example: Labels, etc.",
//         },
//         {
//           name: "asset_sanitization",
//           title:
//             "Do you sanitize/destroy old assets, media, or documents in your business?",
//           type: "radiogroup",
//           isRequired: true,
//           description: "Example: Do you shred PHI or CHD that you collect?",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 4 - Awareness",
//       elements: [
//         {
//           name: "cybersecurity_training",
//           title: "Do you provide cybersecurity awareness training?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 5 - Business Continuity",
//       elements: [
//         {
//           name: "business_continuity_plan",
//           title:
//             "Do you have an established Business Continuity Plan in case of a disaster?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "bcp_training",
//           title:
//             "If yes: Do you train employees on proper roles and responsibilities?",
//           type: "radiogroup",
//           isRequired: true,
//           visibleIf: "{business_continuity_plan} = 'yes'",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "data_backups",
//           title: "Do you perform data backups in place online or offline?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "online", text: "Online" },
//             { value: "offline", text: "Offline" },
//             { value: "both", text: "Both" },
//             { value: "none", text: "None" },
//           ],
//         },
//         {
//           name: "backup_encryption",
//           title: "If yes: Is backup data encrypted?",
//           type: "radiogroup",
//           isRequired: true,
//           visibleIf: "{data_backups} != 'none'",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 6 - Card Payments",
//       elements: [
//         {
//           name: "payment_security_steps",
//           title:
//             "What steps do you take to ensure the security of payment systems and keep your software and systems updated against vulnerabilities?",
//           type: "comment",
//           isRequired: true,
//         },
//         {
//           name: "store_cardholder_data",
//           title: "Do you store cardholder data (CHD)?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "encrypt_cardholder_data",
//           title: "If yes: Do you encrypt stored cardholder (CHD) information?",
//           type: "radiogroup",
//           isRequired: true,
//           visibleIf: "{store_cardholder_data} = 'yes'",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "payment_device_security",
//           title:
//             "Are all devices that accept credit card payments secured from tampering & skimming?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "cc_payment_website",
//           title: "Do you accept credit card payment through your website?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 7 - Change & Configuration Management",
//       elements: [
//         {
//           name: "change_management",
//           title: "Do you manage changes to information systems?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "software_download",
//           title:
//             "Do employees have the ability to download and install any software (SW) they want?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 8 - Data Protection",
//       elements: [
//         {
//           name: "data_protection_processes",
//           title:
//             "Do you have any processes to protect sensitive data during transmission & storage?",
//           type: "comment",
//           isRequired: true,
//           description: "Example: PII, PHI, or company data",
//         },
//         {
//           name: "remote_wipe_capability",
//           title:
//             "Do you have the ability to remotely wipe company assets that employees use for work?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 9 - Domain & DNS",
//       elements: [
//         {
//           name: "domain_registration_process",
//           title:
//             "Do you have a process in place to ensure your domain registration does not lapse/expire?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 10 - Email & Messages",
//       elements: [
//         {
//           name: "email_account_security",
//           title: "Do you take measures to secure all employee email accounts?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "email_attack_training",
//           title: "Do you train employees on common email attacks?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "email_usage_policy",
//           title: "Do you have an email proper use policy?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 11 - Endpoints & Mobile Devices",
//       elements: [
//         {
//           name: "device_ownership",
//           title:
//             "Does the company own all computers/laptops/workstations/mobile devices?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "device_security_protections",
//           title: "Do you have security protections in place for these devices?",
//           type: "radiogroup",
//           isRequired: true,
//           description:
//             "Example: AV, Firewall, inactivity timeout, Auto updates, etc.",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "device_protections_detail",
//           title: "If yes: What types of protections are in place?",
//           type: "comment",
//           isRequired: true,
//           visibleIf: "{device_security_protections} = 'yes'",
//         },
//         {
//           name: "local_admin_password",
//           title:
//             "Do you use a unique, strong local admin password for each workstation?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "mobile_device_policy",
//           title:
//             "Are there documented policies and procedures for using mobile devices in the organization?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 12 - Human Resources",
//       elements: [
//         {
//           name: "background_checks",
//           title: "Do you perform background checks on new hires?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "incident_reporting",
//           title:
//             "Are there formal procedures for employees to report cybersecurity incidents?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "incident_tracking",
//           title: "If yes: How are these incidents tracked and managed?",
//           type: "comment",
//           isRequired: true,
//           visibleIf: "{incident_reporting} = 'yes'",
//         },
//         {
//           name: "disgruntled_employee_risk",
//           title:
//             "Is there a process to identify potentially disgruntled employees that pose a risk to your company?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 13 - Incident Response",
//       elements: [
//         {
//           name: "cyberattack_preparedness",
//           title:
//             "Do you have any tools or procedures to prepare, detect, and react to a cyber-attack?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "incident_notification",
//           title:
//             "Do you have a process for notifying all affected parties in case of a cyber-attack?",
//           type: "comment",
//           isRequired: true,
//           description:
//             "Example: customers, law enforcement, shareholders, regulatory agencies, etc.",
//         },
//         {
//           name: "cyberattack_experience",
//           title: "Have you ever experienced a cybersecurity incident?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "incident_response_improvement",
//           title:
//             "If yes: Have you reviewed and improved your incident response process after a successful cyber-attack?",
//           type: "radiogroup",
//           isRequired: true,
//           visibleIf: "{cyberattack_experience} = 'yes'",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 14 - Information Security Management",
//       elements: [
//         {
//           name: "cybersecurity_program",
//           title:
//             "Is there a formal Cybersecurity program in place, and does it have an information security policy in place?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "roles_responsibilities",
//           title:
//             "If yes: Are roles and responsibilities clearly outlined for individuals within the organization?",
//           type: "radiogroup",
//           isRequired: true,
//           visibleIf: "{cybersecurity_program} = 'yes'",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 15 - Logging & Monitoring",
//       elements: [
//         {
//           name: "audit_logs",
//           title: "Are audit logs enabled and are they reviewed?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 16 - Operations & Maintenance",
//       elements: [
//         {
//           name: "security_measures",
//           title:
//             "Does the company have security measures in place to protect its systems and sensitive information, and has it identified the most important ones?",
//           type: "comment",
//           isRequired: true,
//         },
//         {
//           name: "maintenance_monitoring",
//           title:
//             "Is maintenance of systems and infrastructure monitored and controlled?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "maintenance_supervision",
//           title: "Are maintenance personnel’s activities supervised?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "patch_management",
//           title:
//             "Do all systems and software receive the latest vendor-supplied security patches installed?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 17 - Passwords & Secrets",
//       elements: [
//         {
//           name: "password_policy_enforced",
//           title:
//             "Are strong password (14+ complex characters or longest allowed) policies enforced across the organization?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "password_policy_on_assets",
//           title:
//             "If yes: Is the password policy enforced on all company assets?",
//           type: "radiogroup",
//           isRequired: true,
//           visibleIf: "{password_policy_enforced} = 'yes'",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "password_management_tool",
//           title: "Are employees using a password management tool?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 18 - Physical Infrastructure",
//       elements: [
//         {
//           name: "physical_access_controls",
//           title:
//             "Do you have measures in place to control physical access to your company’s site?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "physical_access_measures",
//           title: "If yes: What types of measures are in place?",
//           type: "comment",
//           isRequired: true,
//           visibleIf: "{physical_access_controls} = 'yes'",
//           description:
//             "Example: Physical locks, PIN or swipe, CCTV, Security guard, alarm system, etc.",
//         },
//       ],
//     },
//     {
//       title: "Section 19 - Risk Management",
//       elements: [
//         {
//           name: "risk_management_plan",
//           title: "Do you perform a risk management plan?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "cyber_insurance",
//           title: "Do you have an insurance policy covering cybersecurity?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 20 - Service Provider & Vendor Management",
//       elements: [
//         {
//           name: "service_providers",
//           title: "What service providers/vendors do you utilize?",
//           type: "comment",
//           isRequired: true,
//         },
//         {
//           name: "vendor_vetting",
//           title:
//             "Do you vet them to ensure that they are reputable and have security measures in place?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "vendor_regulatory",
//           title: "Do you ensure that they meet regulatory standards?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//       ],
//     },
//     {
//       title: "Section 21 - Vulnerability Management",
//       elements: [
//         {
//           name: "vulnerability_management_program",
//           title: "Do you have a vulnerability management program?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "vulnerability_assessment",
//           title: "If yes: How are these vulnerabilities assessed?",
//           type: "comment",
//           isRequired: true,
//           visibleIf: "{vulnerability_management_program} = 'yes'",
//         },
//       ],
//     },
//     {
//       title: "Section 22 - Website & Web Application",
//       elements: [
//         {
//           name: "website_existence",
//           title: "Do you have a website?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "external_hosting",
//           title: "If yes: Is your website hosted by an external party?",
//           type: "radiogroup",
//           isRequired: true,
//           visibleIf: "{website_existence} = 'yes'",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "customer_data_handling",
//           title:
//             "If yes: Do you handle sensitive customer data? (PII, PHI, CHD, etc.)",
//           type: "radiogroup",
//           isRequired: true,
//           visibleIf: "{website_existence} = 'yes'",
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "website_security_measures",
//           title: "If yes: How do you secure this data?",
//           type: "comment",
//           isRequired: true,
//           visibleIf: "{customer_data_handling} = 'yes'",
//         },
//         {
//           name: "third_party_payment",
//           title:
//             "Do you use a third-party service provider for financial data or payment processing?",
//           type: "radiogroup",
//           isRequired: true,
//           choices: [
//             { value: "yes", text: "Yes" },
//             { value: "no", text: "No" },
//           ],
//         },
//         {
//           name: "third_party_payment_security",
//           title: "If yes: How is this data being secured?",
//           type: "comment",
//           isRequired: true,
//           visibleIf: "{third_party_payment} = 'yes'",
//         },
//       ],
//     },
//   ],
// };

const surveyJson = {
  showProgressBar: "topBottom",
  progressBarType: "buttons",
  showTOC: false,
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
      title: "Section 2 - Access",
      elements: [
        {
          name: "inventory_accounts",
          title: "Do you maintain an updated inventory of all accounts?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "account_change_process",
          title:
            "Do you have a process to secure user account credential changes (password, username change)?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "unique_employee_accounts",
          title:
            "Does each employee have a unique account and access only to the company resources they need for their role?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "privileged_accounts",
          title:
            "Do you have separate accounts for Privileged or Admin Accounts?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "admin_password",
          title: "Does each Admin account have a separate password?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "mfa_usage",
          title: "Do you utilize Multi-Factor-Authentication (MFA)?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "sso_usage",
          title: "Do you use Single-Sign-On (SSO) for any of your systems?",
          type: "radiogroup",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          name: "account_details_protected",
          title:
            "Do you ensure that account details like usernames and passwords are protected from misuse?",
          type: "radiogroup",
          isRequired: true,
          description: "Example: Posted on a sticky note next to the computer",
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
      ],
    },
  ],
};

export { surveyJson };
