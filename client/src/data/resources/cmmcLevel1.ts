export type CmmcLevel1Control = {
  controlId: string;
  requirement: string;
  plainEnglish: string;
  assessmentQuestions: string[];
  poam: string;
  remediationGuidance: string;
  evidence: string;
  policy: string;
};

const cmmcLevel1Data: CmmcLevel1Control[] = [
  {
    controlId: "AC.L1-b.1.i",
    requirement: "Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).",
    plainEnglish: "Only approved users and devices can log into systems.",
    assessmentQuestions: [
      "Do you only grant accounts to authorized users?",
      "Are unauthorized devices blocked?"
    ],
    poam: "The company does not restrict access to authorized users and devices. To remediate, it will implement access controls, disable unused accounts, and maintain a device inventory.",
    remediationGuidance: "Review accounts and devices regularly. Disable unused accounts and restrict system access to known devices.",
    evidence: "User account list, access control policy, device inventory.",
    policy: "Access Control Policy"
  },
  {
    controlId: "AC.L1-b.1.ii",
    requirement: "Limit information system access to the types of transactions and functions that authorized users are permitted to execute.",
    plainEnglish: "Users only get permissions needed for their job.",
    assessmentQuestions: [
      "Are user rights based on role?",
      "Are admin accounts limited?"
    ],
    poam: "The company does not apply least privilege. To remediate, it will assign rights by role and limit admin accounts.",
    remediationGuidance: "Set up role-based access, remove unnecessary admin rights, and review privileges periodically.",
    evidence: "User roles list, screenshots of account types, least privilege policy.",
    policy: "Access Control Policy (Least Privilege Rules)"
  },
  {
    controlId: "AC.L1-b.1.iii",
    requirement: "Verify and control/limit connections to and use of external information systems.",
    plainEnglish: "Limit use of external systems and services to those you trust and authorize.",
    assessmentQuestions: [
      "Do you control access to external services?",
      "Are rules for external systems documented?"
    ],
    poam: "The company does not limit external connections. To remediate, it will document approved systems and block unapproved ones.",
    remediationGuidance: "Use firewall rules, policies, or approvals to control connections.",
    evidence: "External connection list, policy on external systems.",
    policy: "Access Control Policy / External Systems"
  },
  {
    controlId: "AC.L1-b.1.iv",
    requirement: "Control information posted or processed on publicly accessible information systems.",
    plainEnglish: "Review content before posting publicly; don’t share FCI.",
    assessmentQuestions: [
      "Is there a review process for public postings?",
      "Are FCI restrictions in place?"
    ],
    poam: "The company does not review public postings. To remediate, it will establish a review/approval process and prohibit FCI posting.",
    remediationGuidance: "Designate approvers, create a review checklist.",
    evidence: "Posting procedure, review forms.",
    policy: "Information Posting / Access Control Policy"
  },
  {
    controlId: "IA.L1-b.1.v",
    requirement: "Identify information system users, processes acting on behalf of users, or devices.",
    plainEnglish: "Every user, process, and device must be uniquely identified.",
    assessmentQuestions: [
      "Do all users have unique accounts?",
      "Is there an inventory of users, devices, and cloud systems with role-based access?"
    ],
    poam: "The company does not identify users/devices uniquely. To remediate, it will assign unique IDs and maintain an inventory.",
    remediationGuidance: "Remove shared accounts, maintain user/device/cloud inventory.",
    evidence: "Account list, inventory spreadsheet.",
    policy: "Identification & Authentication Policy"
  },
  {
    controlId: "IA.L1-b.1.vi",
    requirement: "Authenticate (or verify) the identities of those users, processes, or devices, as a prerequisite to allowing access to organizational information systems.",
    plainEnglish: "Users and devices must prove who they are before access is granted.",
    assessmentQuestions: [
      "Do all users log in with a password or stronger method?",
      "Are devices verified before connection?"
    ],
    poam: "The company does not authenticate all accounts. To remediate, it will require passwords for all systems and restrict access to verified devices.",
    remediationGuidance: "Enable password/MFA, restrict personal devices, enforce authentication across systems.",
    evidence: "Login screenshots, password policy.",
    policy: "Identification & Authentication Policy / Password Policy"
  },
  {
    controlId: "MP.L1-b.1.vii",
    requirement: "Sanitize or destroy information system media containing Federal Contract Information before disposal or release for reuse.",
    plainEnglish: "Wipe or destroy drives and shred paper before disposal.",
    assessmentQuestions: [
      "Do you wipe/destroy media before disposal?",
      "Do you shred paper with FCI?"
    ],
    poam: "Media is not sanitized before disposal. To remediate, it will adopt sanitization and destruction processes.",
    remediationGuidance: "Use disk wipe tools, shredding services, paper shredders.",
    evidence: "Certificates of destruction, wipe logs.",
    policy: "Media Protection Policy"
  },
  {
    controlId: "PE.L1-b.1.viii",
    requirement: "Limit physical access to organizational information systems, equipment, and the respective operating environments to authorized individuals.",
    plainEnglish: "Lock down office/WFH spaces so only authorized staff can access systems.",
    assessmentQuestions: [
      "Are physical areas with FCI restricted?",
      "Do you control WFH access (family/guests)?"
    ],
    poam: "No physical access controls exist. To remediate, it will add locks, restrict WFH, and track access keys/badges.",
    remediationGuidance: "Use locks, keycards, restrict device use in WFH setups.",
    evidence: "Photos of locks, access lists, WFH policy.",
    policy: "Physical Security Policy"
  },
  {
    controlId: "PE.L1-b.1.ix",
    requirement: "Escort visitors and monitor visitor activity; maintain audit logs of physical access.",
    plainEnglish: "Track all visitors and ensure they’re supervised.",
    assessmentQuestions: [
      "Do you keep visitor logs?",
      "Are visitors escorted at all times?"
    ],
    poam: "Visitors are not logged or escorted. To remediate, it will create a visitor log and escort procedure.",
    remediationGuidance: "Maintain sign-in logs, escort visitors, apply WFH visitor rules.",
    evidence: "Visitor log samples, escort policy.",
    policy: "Visitor Management Procedure"
  },
  {
    controlId: "SC.L1-b.1.x",
    requirement: "Monitor, control, and protect organizational communications at the external and key internal boundaries of information systems.",
    plainEnglish: "Use firewalls or router/device protections to control traffic.",
    assessmentQuestions: [
      "Is there a firewall on router/devices?",
      "Are communications restricted to secure connections?"
    ],
    poam: "No boundary protections are in place. To remediate, it will enable router/device firewalls and require secure connections.",
    remediationGuidance: "Enable router/device firewalls, VPN, SSL/TLS. Hardware firewall optional.",
    evidence: "Firewall screenshots, policy.",
    policy: "System & Communications Protection Policy"
  },
  {
    controlId: "SC.L1-b.1.xi",
    requirement: "Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.",
    plainEnglish: "Keep public-facing systems separate from internal FCI systems.",
    assessmentQuestions: [
      "Do you host public-facing systems?",
      "Are they separated from internal networks?"
    ],
    poam: "Public systems are not isolated. To remediate, it will use external hosting or VLAN/DMZ separation.",
    remediationGuidance: "Host websites externally, use guest/DMZ networks, configure cloud separation.",
    evidence: "Hosting agreements, network diagrams.",
    policy: "Network Segmentation Procedure"
  },
  {
    controlId: "SI.L1-b.1.xii",
    requirement: "Identify, report, and correct information and information system flaws in a timely manner.",
    plainEnglish: "Apply updates and fix flaws promptly.",
    assessmentQuestions: [
      "Do you apply OS/software patches regularly?",
      "Do you track flaws and fixes?"
    ],
    poam: "Flaws are not remediated timely. To remediate, it will enable patch management and track fixes.",
    remediationGuidance: "Enable auto-updates, track patches in logs/spreadsheets.",
    evidence: "Patch logs, update screenshots.",
    policy: "Patch Management Policy"
  },
  {
    controlId: "SI.L1-b.1.xiii",
    requirement: "Provide protection from malicious code at appropriate locations within organizational information systems.",
    plainEnglish: "Install and maintain antivirus/endpoint protection everywhere.",
    assessmentQuestions: [
      "Do all devices have antivirus?",
      "Is cloud/email malware protection enabled?"
    ],
    poam: "Malware protection not in place. To remediate, it will deploy antivirus on all systems.",
    remediationGuidance: "Install antivirus, enable auto-updates, use cloud email protection.",
    evidence: "AV screenshots, logs.",
    policy: "Malware Protection Policy"
  },
  {
    controlId: "SI.L1-b.1.xiv",
    requirement: "Update malicious code protection mechanisms when new releases are available.",
    plainEnglish: "Ensure antivirus and malware protections are always current.",
    assessmentQuestions: [
      "Are antivirus definitions updated automatically?",
      "Do you verify updates?"
    ],
    poam: "Malware protection not updated. To remediate, it will enable auto-updates and verify deployment.",
    remediationGuidance: "Configure auto-updates, check logs, rely on vendor-managed cloud protections.",
    evidence: "Update logs, screenshots.",
    policy: "Malware Update Procedure"
  },
  {
    controlId: "SI.L1-b.1.xv",
    requirement: "Perform periodic scans of the information system and real-time scans of files from external sources as files are downloaded, opened, or executed.",
    plainEnglish: "Run scheduled scans and real-time scans for files and downloads.",
    assessmentQuestions: [
      "Are periodic malware scans run?",
      "Is real-time scanning enabled?"
    ],
    poam: "Scans not performed. To remediate, it will enable real-time scanning and schedule scans.",
    remediationGuidance: "Enable daily/weekly scans, ensure AV scans files in real time.",
    evidence: "Scan logs, AV settings screenshots.",
    policy: "Malware Scanning Procedure"
  },
  {
    controlId: "CM.L1-b.1.xvi",
    requirement: "Establish and maintain baseline configurations and inventories of organizational information systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.",
    plainEnglish: "Maintain an inventory of systems, software, and their baseline settings.",
    assessmentQuestions: [
      "Do you track all hardware and software?",
      "Do you maintain baseline configurations?"
    ],
    poam: "No inventory/baselines exist. To remediate, it will create and maintain system inventories.",
    remediationGuidance: "Create asset inventory, document baseline configurations, update as systems change.",
    evidence: "Inventory list, baseline screenshots.",
    policy: "Configuration Management Policy"
  },
  {
    controlId: "PS.L1-b.1.xvii",
    requirement: "Screen individuals prior to authorizing access to organizational information systems containing Federal Contract Information.",
    plainEnglish: "Screen employees (background/reference checks) before giving access to systems with FCI.",
    assessmentQuestions: [
      "Do you screen personnel before granting access?",
      "Is screening part of hiring procedures?"
    ],
    poam: "Personnel not screened before access. To remediate, it will adopt screening in hiring and link to system access approvals.",
    remediationGuidance: "Use HR services for background checks, link screening to account creation process.",
    evidence: "HR records, policy documents.",
    policy: "Personnel Security Policy"
  }
];

export default cmmcLevel1Data
