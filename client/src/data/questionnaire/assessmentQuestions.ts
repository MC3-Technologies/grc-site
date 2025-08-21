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
          name: "onboarding^What is the name of your organization?^organizationName",
          title: "What is the name of your organization?",
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "onboarding^What is your organization's primary business address?^employeeCount",
          title: "What is your organization's primary business address?",
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "onboarding^How many devices do you have?^deviceCount",
          title: "How many devices do you have?",
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "onboarding^How many workstation/Laptops does your organization have?^workstationsLaptops",
          title: "How many workstation/Laptops does your organization have?",
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "onboarding^How many mobile devices/tablets does your organization have?^mobileDevicesTablets",
          title: "How many mobile devices/tablets does your organization have?",
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "onboarding^How many office locations do you have?^officeLocations",
          title: "How many office locations do you have?",
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "onboarding^Do you have remote employees?^remoteEmployees",
          title: "Do you have remote employees?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "text",
          inputType: "number",
          name: "onboarding^If yes, how many remote employees?^remoteEmployees_followup",
          title: "If yes, how many remote employees?",
          isRequired: true,
          visibleIf:
            "{onboarding^Do you have remote employees?^remoteEmployees} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "onboarding^Do you allow employees to utilize personal devices to access company data?^personalDeviceUsage",
          title:
            "Do you allow employees to utilize personal devices to access company data?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "dropdown",
          name: "onboarding^What industry does your business belong to?^industry",
          title: "What industry does your business belong to?",
          choices: [
            { value: "health", text: "Health" },
            { value: "sales", text: "Sales" },
            { value: "commerce", text: "Commerce" },
            { value: "other", text: "Other" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "onboarding^If 'Other', please list your industry:^industry_followup",
          title: "If 'Other', please list your industry:",
          isRequired: true,
          visibleIf:
            "{onboarding^What industry does your business belong to?^industry} = 'Other'",
        },
        {
          type: "radiogroup",
          name: "onboarding^Do you have any policies or procedures that cover IT/Cybersecurity?^itPoliciesQuestion",
          title:
            "Do you have any policies or procedures that cover IT/Cybersecurity?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "onboarding^If yes, please list any policies or procedures you may have:^itPoliciesQuestion_followup",
          title: "If yes, please list any policies or procedures you may have:",
          isRequired: true,
          visibleIf:
            "{onboarding^Do you have any policies or procedures that cover IT/Cybersecurity?^itPoliciesQuestion} = 'Yes'",
        },
      ],
    },
    {
      name: "accessControl",
      title: "Access Control (AC)",
      elements: [
        {
          type: "radiogroup",
          name: "AC.L1-b.1.i@Do your employees use individual (not shared) accounts to access company systems and data?@individualAccounts",
          title:
            "Do your employees use individual (not shared) accounts to access company systems and data?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, please list any policies or procedures you may have that enforce this.**individualAccounts_followup",
          title:
            "If yes, please list any policies or procedures you may have that enforce this.",
          isRequired: true,
          visibleIf:
            "{AC.L1-b.1.i@Do your employees use individual (not shared) accounts to access company systems and data?@individualAccounts} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "AC.L1-b.1.ii@Do you limit each employee’s access so they can only perform tasks relevant to their job role?@limitedAccess",
          title:
            "Do you limit each employee’s access so they can only perform tasks relevant to their job role?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, please list any policies or procedures you may have that outline job roles and access.**limitedAccess_followup",
          title:
            "If yes, please list any policies or procedures you may have that outline job roles and access.",
          isRequired: true,
          visibleIf:
            "{AC.L1-b.1.ii@Do you limit each employee’s access so they can only perform tasks relevant to their job role?@limitedAccess} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "AC.L1-b.1.iii@Do you control and monitor all external system connections (e.g., cloud services, remote systems)?@externalMonitor",
          title:
            "Do you control and monitor all external system connections (e.g., cloud services, remote systems)?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, please describe the controls you have in place.**externalMonitor_followup",
          title: "If yes, please describe the controls you have in place.",
          isRequired: true,
          visibleIf:
            "{AC.L1-b.1.iii@Do you control and monitor all external system connections (e.g., cloud services, remote systems)?@externalMonitor} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "AC.L1-b.1.iv@Do you review and approve what company information can be made public (e.g., on your website)?@publicReview",
          title:
            "Do you review and approve what company information can be made public (e.g., on your website)?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, please list any policies or procedures you may have that enforce this.**publicReview_followup",
          title:
            "If yes, please list any policies or procedures you may have that enforce this.",
          isRequired: true,
          visibleIf:
            "{AC.L1-b.1.iv@Do you review and approve what company information can be made public (e.g., on your website)?@publicReview} = 'Yes'",
        },
      ],
    },
    {
      name: "identificationAuthentication",
      title: "Identification & Authentication (IA)",
      elements: [
        {
          type: "radiogroup",
          name: "IA.L1-b.1.v@Is each person uniquely identified before they can log into your systems?@uniqueUser",
          title:
            "Is each person uniquely identified before they can log into your systems?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, do you have an inventory of all users and the systems they have access to?**uniqueUser_followup",
          title:
            "If yes, do you have an inventory of all users and the systems they have access to?",
          isRequired: true,
          visibleIf:
            "{IA.L1-b.1.v@Is each person uniquely identified before they can log into your systems?@uniqueUser} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "IA.L1-b.1.v@Is each device uniquely identified before they can log into your systems?@uniqueDevice",
          title:
            "Is each device uniquely identified before they can log into your systems?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, how is this implemented (Active Directory, Office 365, Duo, etc.)?**uniqueDevice_followup",
          title:
            "If yes, how is this implemented (Active Directory, Office 365, Duo, etc.)?",
          isRequired: true,
          visibleIf:
            "{IA.L1-b.1.v@Is each device uniquely identified before they can log into your systems?@uniqueDevice} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "IA.L1-b.1.vi@Are users required to enter a password or use another method to verify their identity?@passwordAuth",
          title:
            "Are users required to enter a password or use another method to verify their identity?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, do you have a password authentication policy that outlines password requirements?**passwordAuth_followup",
          title:
            "If yes, do you have a password authentication policy that outlines password requirements?",
          isRequired: true,
          visibleIf:
            "{IA.L1-b.1.vi@Are users required to enter a password or use another method to verify their identity?@passwordAuth} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "IA.L1-b.1.vii@Is Multi-Factor Authentication utilized?@mfaEnabled",
          title: "Is Multi-Factor Authentication utilized?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, how is this implemented and is this enabled on all systems, including cloud-based systems (e.g., Office 365, Google Workspaces, AutoDesk, etc.)?**mfaEnabled_followup",
          title:
            "If yes, how is this implemented and is this enabled on all systems, including cloud-based systems (e.g., Office 365, Google Workspaces, AutoDesk, etc.)?",
          isRequired: true,
          visibleIf:
            "{IA.L1-b.1.vii@Is Multi-Factor Authentication utilized?@mfaEnabled} = 'Yes'",
        },
      ],
    },
    {
      name: "mediaProtection",
      title: "Media Protection (MP)",
      elements: [
        {
          type: "radiogroup",
          name: "MP.L1-b.1.vii@Do you properly destroy or wipe computers, hard drives, or media before disposing of them?@mediaWipe",
          title:
            "Do you properly destroy or wipe computers, hard drives, or media before disposing of them?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, what is the process? Is this documented?**mediaWipe_followup",
          title: "If yes, what is the process? Is this documented?",
          isRequired: true,
          visibleIf:
            "{MP.L1-b.1.vii@Do you properly destroy or wipe computers, hard drives, or media before disposing of them?@mediaWipe} = 'Yes'",
        },
      ],
    },
    {
      name: "physicalProtection",
      title: "Physical Protection (PE)",
      elements: [
        {
          type: "radiogroup",
          name: "PE.L1-b.1.viii@Are workstations, servers, and sensitive equipment kept in secure areas with restricted access?@secureEquip",
          title:
            "Are workstations, servers, and sensitive equipment kept in secure areas with restricted access?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, describe how these areas are secured and what measures are taken?**secureEquip_followup",
          title:
            "If yes, describe how these areas are secured and what measures are taken?",
          isRequired: true,
          visibleIf:
            "{PE.L1-b.1.viii@Are workstations, servers, and sensitive equipment kept in secure areas with restricted access?@secureEquip} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "PE.L1-b.1.ix@Do you log and monitor visitors when they enter secure company areas?@visitorLog",
          title:
            "Do you log and monitor visitors when they enter secure company areas?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, do you have a policy documenting this and a visitor log?**visitorLog_followup",
          title:
            "If yes, do you have a policy documenting this and a visitor log?",
          isRequired: true,
          visibleIf:
            "{PE.L1-b.1.ix@Do you log and monitor visitors when they enter secure company areas?@visitorLog} = 'Yes'",
        },
      ],
    },
    {
      name: "systemCommunicationsProtection",
      title: "System & Communications Protection (SC)",
      elements: [
        {
          type: "radiogroup",
          name: "SC.L1-b.1.x@Do you use security tools (like firewalls or antivirus) to protect your network from outside threats?@secTools",
          title:
            "Do you use security tools (like firewalls or antivirus) to protect your network from outside threats?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, list these tools and software in use.**secTools_followup",
          title: "If yes, list these tools and software in use.",
          isRequired: true,
          visibleIf:
            "{SC.L1-b.1.x@Do you use security tools (like firewalls or antivirus) to protect your network from outside threats?@secTools} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "SC.L1-b.1.xi@If you have a public website, is it kept separate from your internal business systems?@publicSite",
          title:
            "If you have a public website, is it kept separate from your internal business systems?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, do you have a policy in place documenting website management and information approval before posting?**publicSite_followup",
          title:
            "If yes, do you have a policy in place documenting website management and information approval before posting?",
          isRequired: true,
          visibleIf:
            "{SC.L1-b.1.xi@If you have a public website, is it kept separate from your internal business systems?@publicSite} = 'Yes'",
        },
      ],
    },
    {
      name: "systemInformationIntegrity",
      title: "System & Information Integrity (SI)",
      elements: [
        {
          type: "radiogroup",
          name: "SI.L1-b.1.xii@Do you install security patches and updates on your systems as soon as possible?@patchUpdates",
          title:
            "Do you install security patches and updates on your systems as soon as possible?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, do you enable auto-update for OS updates/patches, install updates for third-party applications, and enable auto-update for all third-party apps?**patchUpdates_followup",
          title:
            "If yes, do you enable auto-update for OS updates/patches, install updates for third-party applications, and enable auto-update for all third-party apps?",
          isRequired: true,
          visibleIf:
            "{SI.L1-b.1.xii@Do you install security patches and updates on your systems as soon as possible?@patchUpdates} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "SI.L1-b.1.xiii@Do you use antivirus or endpoint protection on all company devices?@antivirusUsage",
          title:
            "Do you use antivirus or endpoint protection on all company devices?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "comment",
          name: "If yes, please list all tools utilized.**antivirusUsage_followup",
          title: "If yes, please list all tools utilized.",
          isRequired: true,
          visibleIf:
            "{SI.L1-b.1.xiii@Do you use antivirus or endpoint protection on all company devices?@antivirusUsage} = 'Yes'",
        },
        {
          type: "radiogroup",
          name: "SI.L1-b.1.xiv@Do you regularly update your antivirus software to ensure it can detect new threats?@antivirusUpdate",
          title:
            "Do you regularly update your antivirus software to ensure it can detect new threats?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "SI.L1-b.1.xv@Do you scan files, emails, or programs before they’re used to make sure they’re safe?@fileScan",
          title:
            "Do you scan files, emails, or programs before they’re used to make sure they’re safe?",
          choices: [
            { value: "Yes", text: "Yes" },
            { value: "No", text: "No" },
          ],
          isRequired: true,
        },
      ],
    },
  ],
};

export { surveyJson };
