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
  description: "Assessment questionnaire for CMMC Level 1 adherence.",
  pages: [
    {
      name: "onboarding",
      title: "Onboarding Section",
      elements: [
        {
          type: "text",
          inputType: "number",
          name: "employeeCount",
          title: "How many employees do you have?",
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "deviceCount",
          title: "How many devices do you have?",
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "workstationLaptops",
          title: "Workstation/Laptops:",
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "mobileDevices",
          title: "Mobile Devices/Tablets:",
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "officeLocations",
          title: "How many office locations do you have?",
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "remoteEmployees",
          title: "Do you have remote employees?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "remoteEmployees_followup", // no "@" so left unchanged
          title: "If yes, how many remote employees?",
          isRequired: true,
          visibleIf: "{remoteEmployees} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "personalDeviceUsage",
          title:
            "Do you allow employees to utilize personal devices to access company data?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "dropdown",
          name: "industry",
          title: "What industry does your business belong to?",
          choices: [
            "Engineering/Architecture",
            "Technology",
            "Healthcare",
            "Other",
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "industry_followup", // no "@" so left unchanged
          title: "If 'Other', please list your industry:",
          isRequired: true,
          visibleIf: "{industry} = 'Other'",
        },
        {
          type: "radiogroup",
          name: "itPoliciesQuestion",
          title:
            "Do you have any policies or procedures that cover IT/Cybersecurity?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "itPoliciesQuestion_followup", // no "@" so left unchanged
          title: "If yes, please list any policies or procedures you may have.",
          isRequired: true,
          visibleIf: "{itPoliciesQuestion} = 'Yes'",
        },
      ],
    },
    {
      name: "accessControl",
      title: "Access Control (AC)",
      elements: [
        {
          type: "radiogroup",
          // Non-followup transformation: prefix remains, then title is appended.
          name: "AC.L1-b.1.i@Do your employees use individual (not shared) accounts to access company systems and data?",
          title:
            "Do your employees use individual (not shared) accounts to access company systems and data?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          // Followup: take prefix "AC.L1-b.1.i@" and append title, then ensure _followup is at end.
          name: "AC.L1-b.1.i@If yes, please list any policies or procedures you may have that enforce this._followup",
          title:
            "If yes, please list any policies or procedures you may have that enforce this.",
          isRequired: true,
          visibleIf:
            "{AC.L1-b.1.i@Do your employees use individual (not shared) accounts to access company systems and data?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "AC.L1-b.1.ii@Do you limit each employee’s access so they can only perform tasks relevant to their job role?",
          title:
            "Do you limit each employee’s access so they can only perform tasks relevant to their job role?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "AC.L1-b.1.ii@If yes, please list any policies or procedures you may have that outline job roles and access._followup",
          title:
            "If yes, please list any policies or procedures you may have that outline job roles and access.",
          isRequired: true,
          visibleIf:
            "{AC.L1-b.1.ii@Do you limit each employee’s access so they can only perform tasks relevant to their job role?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "AC.L1-b.1.iii@Do you control and monitor all external system connections (e.g., cloud services, remote systems)?",
          title:
            "Do you control and monitor all external system connections (e.g., cloud services, remote systems)?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "AC.L1-b.1.iii@If yes, please describe the controls you have in place._followup",
          title: "If yes, please describe the controls you have in place.",
          isRequired: true,
          visibleIf:
            "{AC.L1-b.1.iii@Do you control and monitor all external system connections (e.g., cloud services, remote systems)?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "AC.L1-b.1.iv@Do you review and approve what company information can be made public (e.g., on your website)?",
          title:
            "Do you review and approve what company information can be made public (e.g., on your website)?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "AC.L1-b.1.iv@If yes, please list any policies or procedures you may have that enforce this._followup",
          title:
            "If yes, please list any policies or procedures you may have that enforce this.",
          isRequired: true,
          visibleIf:
            "{AC.L1-b.1.iv@Do you review and approve what company information can be made public (e.g., on your website)?} = 'Yes'",
        },
      ],
    },
    {
      name: "identificationAuthentication",
      title: "Identification & Authentication (IA)",
      elements: [
        {
          type: "radiogroup",
          name: "IA.L1-b.1.v@Is each person uniquely identified before they can log into your systems?",
          title:
            "Is each person uniquely identified before they can log into your systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "IA.L1-b.1.v@If yes, do you have an inventory of all users and the systems they have access to?_followup",
          title:
            "If yes, do you have an inventory of all users and the systems they have access to?",
          isRequired: true,
          visibleIf:
            "{IA.L1-b.1.v@Is each person uniquely identified before they can log into your systems?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "IA.L1-b.1.v@Is each device uniquely identified before they can log into your systems?",
          title:
            "Is each device uniquely identified before they can log into your systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "IA.L1-b.1.v@If yes, how is this implemented (Active Directory, Office 365, Duo, etc.)?_followup",
          title:
            "If yes, how is this implemented (Active Directory, Office 365, Duo, etc.)?",
          isRequired: true,
          visibleIf:
            "{IA.L1-b.1.v@Is each device uniquely identified before they can log into your systems?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "IA.L1-b.1.vi@Are users required to enter a password or use another method to verify their identity?",
          title:
            "Are users required to enter a password or use another method to verify their identity?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "IA.L1-b.1.vi@If yes, do you have a password authentication policy that outlines password requirements?_followup",
          title:
            "If yes, do you have a password authentication policy that outlines password requirements?",
          isRequired: true,
          visibleIf:
            "{IA.L1-b.1.vi@Are users required to enter a password or use another method to verify their identity?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "IA.L1-b.1.vii@Is Multi-Factor Authentication utilized?",
          title: "Is Multi-Factor Authentication utilized?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "IA.L1-b.1.vii@If yes, how is this implemented?_followup",
          title: "If yes, how is this implemented?",
          isRequired: true,
          visibleIf:
            "{IA.L1-b.1.vii@Is Multi-Factor Authentication utilized?} = 'Yes'",
        },
        {
          type: "comment",
          name: "IA.L1-b.1.vii@If yes, is this enabled on all systems, including cloud-based systems (e.g., Office 365, Google Workspaces, AutoDesk, etc.)?_followup",
          title:
            "If yes, is this enabled on all systems, including cloud-based systems (e.g., Office 365, Google Workspaces, AutoDesk, etc.)?",
          isRequired: true,
          visibleIf:
            "{IA.L1-b.1.vii@Is Multi-Factor Authentication utilized?} = 'Yes'",
        },
      ],
    },
    {
      name: "mediaProtection",
      title: "Media Protection (MP)",
      elements: [
        {
          type: "radiogroup",
          name: "MP.L1-b.1.vii@Do you properly destroy or wipe computers, hard drives, or media before disposing of them?",
          title:
            "Do you properly destroy or wipe computers, hard drives, or media before disposing of them?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "MP.L1-b.1.vii@If yes, what is the process? Is this documented?_followup",
          title: "If yes, what is the process? Is this documented?",
          isRequired: true,
          visibleIf:
            "{MP.L1-b.1.vii@Do you properly destroy or wipe computers, hard drives, or media before disposing of them?} = 'Yes'",
        },
      ],
    },
    {
      name: "physicalProtection",
      title: "Physical Protection (PE)",
      elements: [
        {
          type: "radiogroup",
          name: "PE.L1-b.1.viii@Are workstations, servers, and sensitive equipment kept in secure areas with restricted access?",
          title:
            "Are workstations, servers, and sensitive equipment kept in secure areas with restricted access?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "PE.L1-b.1.viii@If yes, describe how these areas are secured and what measures are taken?_followup",
          title:
            "If yes, describe how these areas are secured and what measures are taken?",
          isRequired: true,
          visibleIf:
            "{PE.L1-b.1.viii@Are workstations, servers, and sensitive equipment kept in secure areas with restricted access?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "PE.L1-b.1.ix@Do you log and monitor visitors when they enter secure company areas?",
          title:
            "Do you log and monitor visitors when they enter secure company areas?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "PE.L1-b.1.ix@If yes, do you have a policy documenting this and a visitor log?_followup",
          title:
            "If yes, do you have a policy documenting this and a visitor log?",
          isRequired: true,
          visibleIf:
            "{PE.L1-b.1.ix@Do you log and monitor visitors when they enter secure company areas?} = 'Yes'",
        },
      ],
    },
    {
      name: "systemCommunicationsProtection",
      title: "System & Communications Protection (SC)",
      elements: [
        {
          type: "radiogroup",
          name: "SC.L1-b.1.x@Do you use security tools (like firewalls or antivirus) to protect your network from outside threats?",
          title:
            "Do you use security tools (like firewalls or antivirus) to protect your network from outside threats?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "SC.L1-b.1.x@If yes, list these tools and software in use._followup",
          title: "If yes, list these tools and software in use.",
          isRequired: true,
          visibleIf:
            "{SC.L1-b.1.x@Do you use security tools (like firewalls or antivirus) to protect your network from outside threats?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "SC.L1-b.1.xi@If you have a public website, is it kept separate from your internal business systems?",
          title:
            "If you have a public website, is it kept separate from your internal business systems?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "SC.L1-b.1.xi@If yes, do you have a policy in place documenting website management and information approval before posting?_followup",
          title:
            "If yes, do you have a policy in place documenting website management and information approval before posting?",
          isRequired: true,
          visibleIf:
            "{SC.L1-b.1.xi@If you have a public website, is it kept separate from your internal business systems?} = 'Yes'",
        },
      ],
    },
    {
      name: "systemInformationIntegrity",
      title: "System & Information Integrity (SI)",
      elements: [
        {
          type: "radiogroup",
          name: "SI.L1-b.1.xii@Do you install security patches and updates on your systems as soon as possible?",
          title:
            "Do you install security patches and updates on your systems as soon as possible?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "SI.L1-b.1.xii@If yes, do you enable auto-update for OS updates/patches, install updates for third-party applications, and enable auto-update for all third-party apps?_followup",
          title:
            "If yes, do you enable auto-update for OS updates/patches, install updates for third-party applications, and enable auto-update for all third-party apps?",
          isRequired: true,
          visibleIf:
            "{SI.L1-b.1.xii@Do you install security patches and updates on your systems as soon as possible?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "SI.L1-b.1.xiii@Do you use antivirus or endpoint protection on all company devices?",
          title:
            "Do you use antivirus or endpoint protection on all company devices?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "comment",
          name: "SI.L1-b.1.xiii@If yes, please list all tools utilized._followup",
          title: "If yes, please list all tools utilized.",
          isRequired: true,
          visibleIf:
            "{SI.L1-b.1.xiii@Do you use antivirus or endpoint protection on all company devices?} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "SI.L1-b.1.xiv@Do you regularly update your antivirus software to ensure it can detect new threats?",
          title:
            "Do you regularly update your antivirus software to ensure it can detect new threats?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "SI.L1-b.1.xv@Do you scan files, emails, or programs before they’re used to make sure they’re safe?",
          title:
            "Do you scan files, emails, or programs before they’re used to make sure they’re safe?",
          choices: ["Yes", "No"],
          isRequired: true,
        },
      ],
    },
  ],
};

export { surveyJson };
