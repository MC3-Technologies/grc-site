type Control = {
  name: string;
  summary: string;
  adherenceInstructions: string[];
  requiredEvidence: string[];
};

type ControlGroup = {
  name: string;
  controls: Control[];
};

export type CmmcModel = {
  name: string;
  level: number;
  controlGroups: ControlGroup[];
};

const level1Controls: ControlGroup[] = [
  {
    name: "Access Control",
    controls: [
      {
        name: "AC.L1-b.1.i – Use Individual Accounts",
        summary:
          "Only the right people should be allowed into your systems, and they should each have their own login.",
        adherenceInstructions: [
          "Give each user their own username and password.",
          "Create and enforce a policy against account sharing.",
          "Maintain a list of: Who has access, What systems they access, When access was granted/removed.",
          "Revoke access right away when someone leaves or changes roles.",
        ],
        requiredEvidence: [
          "A current access list (spreadsheet or log)",
          "Your account use policy",
          "Screenshots showing individual accounts (such as from Active Directory)",
          "Termination logs or emails showing account deactivations",
          "Staff who can confirm in interviews that they don’t share accounts",
        ],
      },
      {
        name: "AC.L1-b.1.ii – Limit Access Based on Job",
        summary:
          "Only allow employees to access the systems and data they need to do their job.",
        adherenceInstructions: [
          "Set up role-based access control in each system (e.g., finance users can’t access engineering files).",
          "Use group permissions in email, file shares, and applications.",
          "Review and update access rights regularly, especially after promotions or departures.",
          "Remove or adjust permissions when roles change.",
        ],
        requiredEvidence: [
          "Role-based access policy or procedure.",
          "Screenshots showing user group assignments.",
          "Access control list or user permissions report.",
          "Record of periodic access reviews (e.g., quarterly access check log).",
        ],
      },
      {
        name: "AC.L1-b.1.iii – Manage Outside Connections",
        summary:
          "Limit and track which outside tools or services connect to your network or systems.",
        adherenceInstructions: [
          "List all cloud services or external vendors used (email, storage, collaboration tools, etc.).",
          "Approve only those you trust and need for business operations.",
          "Block access to unapproved external services via firewall, DNS filtering, or policy.",
          "Keep documentation on why each service is used.",
        ],
        requiredEvidence: [
          "Approved external services list.",
          "Firewall rules or DNS filtering policy.",
          "Vendor contracts or risk acceptance forms.",
          "Change control records for new connections.",
        ],
      },
      {
        name: "AC.L1-b.1.iv – Review Public Info",
        summary:
          "Make sure you’re not accidentally sharing sensitive info online (like on your website or social media).",
        adherenceInstructions: [
          "Only allow specific team members to post to websites or social accounts.",
          "Define what can and cannot be shared (e.g., no internal IPs, contract numbers).",
          "Perform regular reviews of public content to spot accidental leaks.",
        ],
        requiredEvidence: [
          "Communication/public release policy.",
          "List of authorized content posters.",
          "Screenshots or checklist logs of public content reviews.",
        ],
      },
    ],
  },
  {
    name: "Identification & Authentication",
    controls: [
      {
        name: "IA.L1-b.1.v – Know Who’s Logging In",
        summary:
          "Every user must be uniquely identifiable, so you know who’s doing what in your systems.",
        adherenceInstructions: [
          "Assign unique usernames to all users.",
          "Maintain a central access log of who can access which systems.",
          "Revoke user access when they leave or change roles.",
        ],
        requiredEvidence: [
          "Access inventory list with usernames and systems accessed.",
          "HR offboarding checklist showing account removal.",
          "Active user lists from systems (screenshots or exports).",
        ],
      },
      {
        name: "IA.L1-b.1.vi – Require a Password or Similar Check",
        summary:
          "Ensure users prove their identity before accessing any system.",
        adherenceInstructions: [
          "Require passwords, MFA, or biometric login.",
          "Set and enforce password strength rules (length, complexity, expiration).",
          "Reset passwords if there is a security incident or concern.",
        ],
        requiredEvidence: [
          "Authentication policy or procedure.",
          "Screenshot of system-enforced password rules.",
          "Logs or records of password changes due to incidents.",
        ],
      },
    ],
  },
  {
    name: "Media Protection",
    controls: [
      {
        name: "MP.L1-b.1.vii – Properly Get Rid of Old Computers or Hard Drives",
        summary:
          "Erase data securely before disposing of any equipment that stored sensitive info.",
        adherenceInstructions: [
          "Use secure erase software (not just deleting files).",
          "Physically destroy drives when appropriate (e.g., degaussing, shredding).",
          "Keep a disposal log with dates, method, and serial numbers.",
          "If using a vendor, get a certificate of destruction.",
        ],
        requiredEvidence: [
          "Hardware disposal log.",
          "Photos of physical destruction (optional).",
          "Certificate of destruction (if applicable).",
          "Secure wipe reports or logs.",
        ],
      },
    ],
  },
  {
    name: "Physical Protection",
    controls: [
      {
        name: "PE.L1-b.1.viii – Lock Up Sensitive Equipment",
        summary:
          "Protect critical devices (like servers or networking gear) from physical theft or tampering.",
        adherenceInstructions: [
          "Store equipment in locked rooms or cabinets.",
          "Restrict physical access to authorized personnel only.",
          "Keep a list of who has keys or badge access.",
        ],
        requiredEvidence: [
          "Physical access policy.",
          "Photos of locked areas or storage cabinets.",
          "List of personnel with physical access rights.",
        ],
      },
      {
        name: "PE.L1-b.1.ix – Watch Visitors",
        summary:
          "Keep track of anyone who enters secure areas of your facility.",
        adherenceInstructions: [
          "Have visitors sign in and out on a log.",
          "Assign an escort who stays with them during their visit.",
          "Keep visitor logs for 90 days or more.",
        ],
        requiredEvidence: [
          "Visitor log (paper or digital).",
          "Visitor procedure or checklist.",
          "Staff training records for visitor escort policy.",
        ],
      },
    ],
  },
  {
    name: "System & Communications Protection",
    controls: [
      {
        name: "SC.L1-b.1.x – Protect Your Network from Threats",
        summary:
          "Use software and tools to block cyberattacks and monitor for threats.",
        adherenceInstructions: [
          "Install antivirus software on all systems.",
          "Enable and configure firewalls (on devices and networks).",
          "Use tools that alert you to malware or unusual traffic.",
          "Keep all security tools up to date.",
        ],
        requiredEvidence: [
          "Screenshot or report showing antivirus is active and updated.",
          "Firewall configuration files or screenshots.",
          "Logs or alerts from security software.",
        ],
      },
      {
        name: "SC.L1-b.1.xi – Keep Your Website Separate from Business Systems",
        summary:
          "Your public website should not have direct access to your internal business systems.",
        adherenceInstructions: [
          "Host your website in a different network segment or provider.",
          "Ensure the website does not connect to file servers, internal email, or CUI systems.",
          "Verify this separation with your IT team or service provider.",
        ],
        requiredEvidence: [
          "Network diagram showing website isolation.",
          "Statement from IT or service provider.",
          "Firewall rule preventing access from web server to internal systems.",
        ],
      },
    ],
  },
  {
    name: "System & Information Integrity",
    controls: [
      {
        name: "SI.L1-b.1.xii – Fix Security Problems Quickly",
        summary: "Apply software updates regularly to close security gaps.",
        adherenceInstructions: [
          "Turn on automatic updates where possible.",
          "Designate someone to check for and apply patches at least monthly.",
          "Apply critical updates immediately, especially for internet-facing systems.",
        ],
        requiredEvidence: [
          "Patch policy or monthly patch checklist.",
          "Screenshot showing auto-update is enabled.",
          "Logs of applied updates or change control tickets.",
        ],
      },
    ],
  },
];

const cmmcLevel1Data: CmmcModel = {
  name: "CMMC Level 1",
  level: 1,
  controlGroups: level1Controls,
};

export { cmmcLevel1Data };
