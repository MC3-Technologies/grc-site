import {
  AssessmentStorageData,
  CompletedAssessment,
} from "../../../lib/assessment";

const cmmcLevel1Data = {
  version: "cmmc-level-1:1.1.0",
  surveyJson: {
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
            name: "onboarding^What is your company name?^companyName",
            title: "What is your company name?",
            isRequired: true,
          },
          {
            type: "text",
            name: "onboarding^What is your primary business address?^businessAddress",
            title: "What is your primary business address?",
            isRequired: true,
          },
          {
            type: "text",
            name: "onboarding^What is your CAGE code?^cageCode",
            title: "What is your CAGE code?",
            isRequired: true,
          },
          {
            type: "text",
            name: "onboarding^What is your DUNS/UEI (if available)?^dunsUei",
            title: "What is your DUNS/UEI (if available)?",
            isRequired: false,
          },
          {
            type: "text",
            name: "onboarding^What is your primary NAICS code (if known)?^naicsCode",
            title: "What is your primary NAICS code (if known)?",
            isRequired: false,
          },
          {
            type: "comment",
            name: "onboarding^How would you briefly describe your core business (1-2 sentences)?^coreBusiness",
            title:
              "How would you briefly describe your core business (1-2 sentences)?",
            isRequired: true,
          },
          {
            type: "comment",
            name: "onboarding^Who is your primary cybersecurity contact (Name, Title, Email, Phone)?^primaryCyberContact",
            title:
              "Who is your primary cybersecurity contact (Name, Title, Email, Phone)?",
            isRequired: true,
          },
          {
            type: "comment",
            name: "onboarding^Who is your secondary cybersecurity contact (Name, Title, Email, Phone)?^secondaryCyberContact",
            title:
              "Who is your secondary cybersecurity contact (Name, Title, Email, Phone)?",
            isRequired: false,
          },
          {
            type: "checkbox",
            name: "onboarding^What types of Federal Contract Information (FCI) or Controlled Unclassified Information (CUI) does your organization handle?^fciCuiHandled",
            title:
              "What types of Federal Contract Information (FCI) or Controlled Unclassified Information (CUI) does your organization handle?",
            choices: [
              "Engineering drawings / Blueprints",
              "Specifications",
              "Cost estimates",
              "Personally Identifiable Information (PII)",
              "Technical Information (IT System Diagrams, IP addresses, etc.)",
              "Other",
            ],
            isRequired: true,
          },
          {
            type: "text",
            name: "onboarding^What types of Federal Contract Information (FCI) or Controlled Unclassified Information (CUI) does your organization handle?^fciCuiHandled_followup",
            visibleIf:
              "{onboarding^What types of Federal Contract Information (FCI) or Controlled Unclassified Information (CUI) does your organization handle?^fciCuiHandled} contains 'Other'",
            title: "Please describe the other type of information handled:",
            isRequired: true,
          },
          {
            type: "checkbox",
            name: "onboarding^Which systems store or handle this data?^systemsHandlingData",
            title: "Which systems store or handle this data?",
            choices: [
              "Office 365 (Outlook, Sharepoint, OneDrive, etc)",
              "Google Workspace (Gmail, Drive, Docs)",
              "Dropbox, Box, or similar cloud storage",
              "On-Premise File Server / Network Drives",
              "Remote worker laptops",
              "Mobile Devices (phones/tablets)",
              "Other",
            ],
            isRequired: true,
          },
          {
            type: "text",
            name: "onboarding^Which systems store or handle this data?^systemsHandlingData_followup",
            visibleIf:
              "{onboarding^Which systems store or handle this data?^systemsHandlingData} contains 'Other'",
            title: "Please describe the other system used:",
            isRequired: true,
          },
          {
            type: "radiogroup",
            name: "onboarding^How many employees regularly handle FCI/CUI data?^employeesHandlingData",
            title: "How many employees regularly handle FCI/CUI data?",
            choices: ["1-5", "6-10", "11-20", "21 or more"],
            isRequired: true,
          },
          {
            type: "radiogroup",
            name: "onboarding^Who currently manages your IT and security?^itSecurityManagement",
            title: "Who currently manages your IT and security?",
            choices: [
              "Internal Employee(s)",
              "External Managed Service Provider (MSP)",
              "Combination (Internal/External)",
              "Informal / No clearly defined role",
            ],
            isRequired: true,
          },
          {
            type: "radiogroup",
            name: "onboarding^Where is most of your work performed?^workEnvironment",
            title: "Where is most of your work performed?",
            choices: [
              "Office environment",
              "Remote / Work-from-home",
              "Project sites / Job sites",
              "Hybrid / Combination",
            ],
            isRequired: true,
          },
          {
            type: "comment",
            name: "onboarding^What primary software and applications are used to handle FCI/CUI (e.g., email, CAD software, accounting software, etc.)?^primarySoftware",
            title:
              "What primary software and applications are used to handle FCI/CUI (e.g., email, CAD software, accounting software, etc.)?",
            isRequired: true,
          },
          {
            type: "radiogroup",
            name: "onboarding^Do you have any existing cybersecurity or compliance documentation?^existingCyberDocs",
            title:
              "Do you have any existing cybersecurity or compliance documentation?",
            choices: ["Yes", "No"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "onboarding^Do you have any existing cybersecurity or compliance documentation?^existingCyberDocs_followup",
            visibleIf:
              "{onboarding^Do you have any existing cybersecurity or compliance documentation?^existingCyberDocs} = 'Yes'",
            title: "Please describe the existing documentation:",
            isRequired: true,
          },
          {
            type: "radiogroup",
            name: "onboarding^Has your organization previously experienced a cybersecurity incident?^cyberIncidentHistory",
            title:
              "Has your organization previously experienced a cybersecurity incident?",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "onboarding^Has your organization previously experienced a cybersecurity incident?^cyberIncidentHistory_followup",
            visibleIf:
              "{onboarding^Has your organization previously experienced a cybersecurity incident?^cyberIncidentHistory} = 'Yes'",
            title: "Please explain the cybersecurity incident:",
            isRequired: true,
          },
          {
            type: "checkbox",
            name: "onboarding^Why is your organization pursuing CMMC Level 1 compliance now?^complianceReason",
            title:
              "Why is your organization pursuing CMMC Level 1 compliance now?",
            choices: [
              "New contract requirement",
              "Client/customer mandate",
              "Proactive internal risk reduction",
              "Other",
            ],
            isRequired: true,
          },
          {
            type: "text",
            name: "onboarding^Why is your organization pursuing CMMC Level 1 compliance now?^complianceReason_followup",
            visibleIf:
              "{onboarding^Why is your organization pursuing CMMC Level 1 compliance now?^complianceReason} contains 'Other'",
            title: "Please describe the other reason for pursuing compliance:",
            isRequired: true,
          },
          {
            type: "radiogroup",
            name: "onboarding^What is your desired timeline for completion of your CMMC SSP and POA&M?^timelineCompletion",
            title:
              "What is your desired timeline for completion of your CMMC SSP and POA&M?",
            choices: [
              "Immediate (within 30-90 days)",
              "Short-term (3-6 months)",
              "Moderate (6-12 months)",
              "Flexible / no immediate deadline",
            ],
            isRequired: true,
          },
        ],
      },
      {
        name: "questionnaire",
        title: "Questionnaire Section",
        elements: [
          {
            type: "radiogroup",
            name: "Access Control@Do you ensure only authorized users can access FCI/CUI and related systems, based on roles and responsibilities?@authorizedAccess",
            title:
              "Do you ensure only authorized users can access FCI/CUI and related systems, based on roles and responsibilities?",
            description: "Access Control (AC)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain how authorized access is ensured:**authorizedAccess_followup",
            title: "Please explain how authorized access is ensured:",
            visibleIf:
              "{Access Control@Do you ensure only authorized users can access FCI/CUI and related systems, based on roles and responsibilities?@authorizedAccess} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Awareness and Training@Do all personnel receive regular cybersecurity training on protecting FCI/CUI?@trainingProgram",
            title:
              "Do all personnel receive regular cybersecurity training on protecting FCI/CUI?",
            description: "Awareness and Training (AT)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please describe your training program and frequency:**trainingProgram_followup",
            title: "Please describe your training program and frequency:",
            visibleIf:
              "{Awareness and Training@Do all personnel receive regular cybersecurity training on protecting FCI/CUI?@trainingProgram} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Audit and Accountability@Does your organization generate, protect, and review audit logs to detect and respond to unauthorized system activity?@auditLogs",
            title:
              "Does your organization generate, protect, and review audit logs to detect and respond to unauthorized system activity?",
            description: "Audit and Accountability (AU)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain your audit logging and review process:**auditLogs_followup",
            title: "Please explain your audit logging and review process:",
            visibleIf:
              "{Audit and Accountability@Does your organization generate, protect, and review audit logs to detect and respond to unauthorized system activity?@auditLogs} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Configuration Management@Are system configurations managed and controlled to maintain security and prevent unauthorized changes across your IT environment?@configMgmt",
            title:
              "Are system configurations managed and controlled to maintain security and prevent unauthorized changes across your IT environment?",
            description: "Configuration Management (CM)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain your configuration management controls:**configMgmt_followup",
            title: "Please explain your configuration management controls:",
            visibleIf:
              "{Configuration Management@Are system configurations managed and controlled to maintain security and prevent unauthorized changes across your IT environment?@configMgmt} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Identification and Authentication@Do you have methods to verify the identities of users and devices before granting access to systems containing FCI/CUI?@identityVerification",
            title:
              "Do you have methods to verify the identities of users and devices before granting access to systems containing FCI/CUI?",
            description: "Identification and Authentication (IA)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain your identity and device verification methods:**identityVerification_followup",
            title:
              "Please explain your identity and device verification methods:",
            visibleIf:
              "{Identification and Authentication@Do you have methods to verify the identities of users and devices before granting access to systems containing FCI/CUI?@identityVerification} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Incident Response@Does your organization detect, respond to, and recover from cybersecurity incidents involving FCI/CUI?@incidentResponse",
            title:
              "Does your organization detect, respond to, and recover from cybersecurity incidents involving FCI/CUI?",
            description: "Incident Response (IR)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain your incident response capabilities:**incidentResponse_followup",
            title: "Please explain your incident response capabilities:",
            visibleIf:
              "{Incident Response@Does your organization detect, respond to, and recover from cybersecurity incidents involving FCI/CUI?@incidentResponse} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Maintenance@Are system maintenance activities managed and monitored to ensure they do not compromise FCI/CUI security?@maintenanceMgmt",
            title:
              "Are system maintenance activities managed and monitored to ensure they do not compromise FCI/CUI security?",
            description: "Maintenance (MA)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain how maintenance activities are managed and monitored:**maintenanceMgmt_followup",
            title:
              "Please explain how maintenance activities are managed and monitored:",
            visibleIf:
              "{Maintenance@Are system maintenance activities managed and monitored to ensure they do not compromise FCI/CUI security?@maintenanceMgmt} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Media Protection@Do you have procedures that protect, transport, and sanitize physical and digital media containing FCI/CUI?@mediaProtection",
            title:
              "Do you have procedures that protect, transport, and sanitize physical and digital media containing FCI/CUI?",
            description: "Media Protection (MP)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain your media protection and sanitization procedures:**mediaProtection_followup",
            title:
              "Please explain your media protection and sanitization procedures:",
            visibleIf:
              "{Media Protection@Do you have procedures that protect, transport, and sanitize physical and digital media containing FCI/CUI?@mediaProtection} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Personnel Security@Do you ensure that individuals with access to FCI/CUI are properly screened and access is removed upon termination or transfer?@personnelSecurity",
            title:
              "Do you ensure that individuals with access to FCI/CUI are properly screened and access is removed upon termination or transfer?",
            description: "Personnel Security (PS)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain your screening and offboarding practices:**personnelSecurity_followup",
            title: "Please explain your screening and offboarding practices:",
            visibleIf:
              "{Personnel Security@Do you ensure that individuals with access to FCI/CUI are properly screened and access is removed upon termination or transfer?@personnelSecurity} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Physical Protection@Does your organization restrict physical access to systems, equipment, and storage locations that handle FCI/CUI?@physicalAccess",
            title:
              "Does your organization restrict physical access to systems, equipment, and storage locations that handle FCI/CUI?",
            description: "Physical Protection (PE)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain your physical access controls:**physicalAccess_followup",
            title: "Please explain your physical access controls:",
            visibleIf:
              "{Physical Protection@Does your organization restrict physical access to systems, equipment, and storage locations that handle FCI/CUI?@physicalAccess} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Risk Assessment@Do you identify, assess, and respond to cybersecurity risks that could impact the confidentiality of FCI/CUI?@riskAssessment",
            title:
              "Do you identify, assess, and respond to cybersecurity risks that could impact the confidentiality of FCI/CUI?",
            description: "Risk Assessment (RA)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please describe your risk assessment process and cadence:**riskAssessment_followup",
            title: "Please describe your risk assessment process and cadence:",
            visibleIf:
              "{Risk Assessment@Do you identify, assess, and respond to cybersecurity risks that could impact the confidentiality of FCI/CUI?@riskAssessment} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "Security Assessment@Does your organization evaluate and improve the effectiveness of your security controls to protect FCI/CUI?@securityAssessment",
            title:
              "Does your organization evaluate and improve the effectiveness of your security controls to protect FCI/CUI?",
            description: "Security Assessment (CA)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain how security controls are assessed and improved:**securityAssessment_followup",
            title:
              "Please explain how security controls are assessed and improved:",
            visibleIf:
              "{Security Assessment@Does your organization evaluate and improve the effectiveness of your security controls to protect FCI/CUI?@securityAssessment} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "System and Communications Protection@Are your systems and communications protected to prevent unauthorized data transfer and ensure FCI/CUI confidentiality?@commProtection",
            title:
              "Are your systems and communications protected to prevent unauthorized data transfer and ensure FCI/CUI confidentiality?",
            description: "System and Communications Protection (SC)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain your protections for systems and communications:**commProtection_followup",
            title:
              "Please explain your protections for systems and communications:",
            visibleIf:
              "{System and Communications Protection@Are your systems and communications protected to prevent unauthorized data transfer and ensure FCI/CUI confidentiality?@commProtection} = 'Yes'",
            isRequired: true,
          },

          {
            type: "radiogroup",
            name: "System and Information Integrity@Do you detect, report, and correct system flaws or malicious activity that may affect FCI/CUI?@trackSystemFlaws",
            title:
              "Do you detect, report, and correct system flaws or malicious activity that may affect FCI/CUI?",
            description: "System and Information Integrity (SI)",
            choices: ["Yes", "No", "Unsure"],
            isRequired: true,
          },
          {
            type: "comment",
            name: "Please explain how you detect and remediate flaws or malicious activity:**trackSystemFlaws_followup",
            title:
              "Please explain how you detect and remediate flaws or malicious activity:",
            visibleIf:
              "{System and Information Integrity@Do you detect, report, and correct system flaws or malicious activity that may affect FCI/CUI?@trackSystemFlaws} = 'Yes'",
            isRequired: true,
          },
        ],
      },
    ],
  },
};

export { cmmcLevel1Data };

type QuestionAnswer = {
  question: string;
  answer: string | number;
  shortFormQuestion?: string;
  followUp?: QuestionAnswer;
};

type ControlGroupResult = {
  score: number;
  maxScore: number;
  questionAnswers: QuestionAnswer[];
};

export type ReportResult = {
  onboardingResults: QuestionAnswer[];
  controlGroupResults: Map<string, ControlGroupResult>;
  score: number;
  maxScore: number;
};

class Report {
  // Assessment data class variable
  private _assessmentData: Map<string, string | number>;

  constructor(assessmentData: string) {
    // If assessment data is not an object or is null, throw an error
    if (assessmentData === null) {
      throw new Error("Assessment data is null!");
    }

    const questionAnswerMap = new Map<string, string | number>(
      Object.entries(assessmentData),
    );
    this._assessmentData = questionAnswerMap;
  }

  public generateReportData = (): ReportResult => {
    // Return value placeholder
    let ret: ReportResult = {
      onboardingResults: [],
      controlGroupResults: new Map(),
      score: 0,
      maxScore: 0,
    };

    // Call helper method to mutate onboarding results on return data
    ret.onboardingResults = this._getOnboardingData();

    // Call helper method to set control group data structures (not set the scores)
    ret.controlGroupResults = this._setControlGroupResults();

    // Call calculate scores helper method
    ret = this._calculateScores(ret);

    // Return ret
    return ret;
  };

  private _setControlGroupResults = (): Map<string, ControlGroupResult> => {
    const ret = new Map<string, ControlGroupResult>();
    // FOR EACH QUESTION ANSWER IN DATA:
    // 1. Parse question for control group/control -- contains '@'
    // 2. Check if follow up question -- contains 'followup'
    // 3. Check if control group already in return map
    //   If yes :
    //     1. Grab existing map key/value data
    //     2. Mutate that data
    //   If no :
    //     1. Create new map entry with that question

    // Loop through all assessment data
    for (const [key] of this._assessmentData.entries()) {
      // Skip loop iteration if question does not contain '@' which symbolizes a calculatable question
      if (!key.includes("@")) {
        continue;
      }
      // Follow up questions may contain '@' but are not calculatable so skip
      if (key.includes("_followup")) {
        continue;
      }

      // Extract question, answer, control group and control
      const controlGroup = key.split("@")[0];
      const question = key.split("@")[1];
      const shortFormQuestion = key.split("@")[2];
      const answer = this._assessmentData.get(key)!;

      if (ret.has(controlGroup)) {
        // Get control group from map
        const getControlGroup = ret.get(controlGroup)!;
        // Control group controls map data
        const getQuestionAnswers = getControlGroup.questionAnswers;

        // Create new question answer
        const maybeFollowUp = this._getFollowUp(shortFormQuestion);
        const newQuestionAnswer: QuestionAnswer = {
          shortFormQuestion,
          question,
          answer,
          ...(maybeFollowUp != null ? { followUp: maybeFollowUp } : {}),
        };

        getQuestionAnswers.push(newQuestionAnswer);
      } else {
        // Create new question answer
        const maybeFollowUp = this._getFollowUp(shortFormQuestion);
        const newQuestionAnswer: QuestionAnswer = {
          shortFormQuestion,
          question,
          answer,
          ...(maybeFollowUp != null ? { followUp: maybeFollowUp } : {}),
        };

        // Create new control group
        const newControlGroup: ControlGroupResult = {
          score: 0,
          maxScore: 0,
          questionAnswers: [],
        };

        newControlGroup.questionAnswers.push(newQuestionAnswer);

        // Set new control group map
        ret.set(controlGroup, newControlGroup);
      }
    }

    return ret;
  };

  // Get onboarding question and answer
  private _getOnboardingData = (): QuestionAnswer[] => {
    const ret: QuestionAnswer[] = [];
    for (const [key] of this._assessmentData.entries()) {
      // Onboarding questions contaion "^" and "onboarding" so check for that
      if (
        !key.includes("^") ||
        !key.includes("onboarding") ||
        key.includes("followup")
      ) {
        continue;
      }

      // Extract onboarding question and answer
      const question = key.split("^")[1];
      const shortHandQuestion = key.split("^")[2];
      const answer = this._assessmentData.get(key)!;

      // Push new question answer object to return array
      ret.push({ question, answer });

      const maybeFollowUp = this._getFollowUp(shortHandQuestion);
      if (maybeFollowUp !== null) {
        ret.push({
          question: `${question} follow up explaination:`,
          answer: maybeFollowUp.answer,
        });
        continue;
      }
    }

    // Return ret array
    return ret;
  };

  // Get follow up answers for a question
  private _getFollowUp = (shortFormQuestion: string): QuestionAnswer | null => {
    // Return follow up : answer string or null
    let ret: QuestionAnswer | null = null;

    // If assessment data has the followup question, grab it and set return to it
    for (const [key, val] of this._assessmentData.entries()) {
      if (key.includes(`${shortFormQuestion}_followup`)) {
        ret = { question: key.split("**")[0], answer: val };
        break;
      }
    }

    // Return ret
    return ret;
  };

  private _calculateScores = (report: ReportResult): ReportResult => {
    // Return variables place holder
    const ret = report;

    // Loop through control group results
    for (const [, controlGroupResult] of ret.controlGroupResults.entries()) {
      // Loop through control results within control groups

      // Loop through all questions associated with a control
      controlGroupResult.questionAnswers.forEach((questionAnswer) => {
        // Increment individual control, control group and overall max score for every question
        controlGroupResult.maxScore = controlGroupResult.maxScore + 1;
        ret.maxScore = ret.maxScore + 1;

        if (
          typeof questionAnswer.answer === "string" &&
          questionAnswer.answer.toLowerCase() === "yes"
        ) {
          // If question is yes, incremement individual control, control group and overall score
          controlGroupResult.score = controlGroupResult.score + 1;
          ret.score = ret.score + 1;
        }
      });
    }

    return ret;
  };
}

const fetchAssessmentDataWithCache = async (
  assessmentId: string,
): Promise<AssessmentStorageData> => {
  if (localStorage.getItem(`${assessmentId}_assessmentData`) === null) {
    console.log("Assessment data not found in cache, fetching from storage.");
    // If assessment data is not cached in local storage, fetch from storage to use it and cache it

    // Fetch from storage
    const data =
      await CompletedAssessment.fetchAssessmentStorageData(assessmentId);

    // Cache it
    localStorage.setItem(
      `${assessmentId}_assessmentData`,
      JSON.stringify(data),
    );
    console.log("Assessment data cached for next time.");

    return data;
  }
  // If assessment data is cached in local storage, use it
  console.log("Assessment data in cache.");
  return JSON.parse(
    localStorage.getItem(`${assessmentId}_assessmentData`)!,
  ) as AssessmentStorageData;
};

export { Report, fetchAssessmentDataWithCache };
