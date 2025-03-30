import { surveyJson } from "../assessmentQuestions";
import { downloadData, uploadData } from "aws-amplify/storage";


// Constant for localStorage key
export const QUESTIONNAIRE_STORAGE_KEY = "admin-questionnaire-data";
// S3 storage path for master questionnaire
export const MASTER_QUESTIONNAIRE_PATH = "questionnaire/master.json";

// Survey element interfaces
export interface ChoiceItem {
  value: string;
  text: string;
}

export interface SurveyElement {
  type: string;
  name: string;
  title: string;
  isRequired?: boolean;
  choices?: ChoiceItem[];
  description?: string;
  visibleIf?: string;
}

export interface SurveyPage {
  title: string;
  elements: SurveyElement[];
}

// Interface for questionnaire page
export interface QuestionPage {
  title: string;
  elements: SurveyElement[];
  id: string;
}

// Function to load saved questionnaire data from localStorage
export const loadSavedQuestionnaire = (): QuestionPage[] | null => {
  try {
    const savedData = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return null;
  } catch (error) {
    console.error("Error loading saved questionnaire data:", error);
    return null;
  }
};

// Function to save questionnaire to S3
export const saveQuestionnaireToS3 = async (
  pages: QuestionPage[]
): Promise<boolean> => {
  try {
    // Clean up the pages to remove admin-specific fields
    const cleanedPages = pages.map((page) => ({
      title: page.title,
      elements: page.elements,
    }));

    // Create the full questionnaire object
    const questionnaireData = {
      ...surveyJson,
      pages: cleanedPages,
      lastUpdated: new Date().toISOString(),
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(questionnaireData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], "master.json", { type: "application/json" });

    // Upload to S3
    await uploadData({
      path: MASTER_QUESTIONNAIRE_PATH,
      data: file,
      options: { bucket: "assessmentStorage" },
    }).result;

    console.log("Successfully uploaded master questionnaire to S3");
    return true;
  } catch (error) {
    console.error("Error saving questionnaire to S3:", error);
    return false;
  }
};

// Function to fetch questionnaire from S3
export const fetchQuestionnaireFromS3 = async () => {
  try {
    // Download from S3
    const result = await downloadData({
      path: MASTER_QUESTIONNAIRE_PATH,
      options: { bucket: "assessmentStorage" },
    }).result;

    // Parse JSON
    const questionnaireJson = await result.body.text();
    return JSON.parse(questionnaireJson);
  } catch (error) {
    console.error("Error fetching questionnaire from S3:", error);
    return null;
  }
};

// Export the questionnaire data for other components to use
export const getLatestQuestionnaireData = async () => {
  try {
    // First attempt to get centralized questionnaire from S3
    const s3Questionnaire = await fetchQuestionnaireFromS3();
    if (s3Questionnaire) {
      console.log("Using questionnaire from S3");
      return s3Questionnaire;
    }

    // If S3 fetch fails, check localStorage (mainly for admin)
    const savedData = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
    if (savedData) {
      console.log("Using questionnaire from localStorage");
      
      // Remove the id property which is only used in the admin UI
      const pages: QuestionPage[] = JSON.parse(savedData);

      // Create new array without the id property
      const cleanedPages = pages.map((page) => ({
        title: page.title,
        elements: page.elements,
      }));

      // Return the complete survey configuration with updated pages
      return {
        ...surveyJson,
        pages: cleanedPages,
      };
    }

    // If no custom questionnaire is found, return the default
    console.log("Using default questionnaire");
    return surveyJson;
  } catch (error) {
    console.error("Error retrieving questionnaire data:", error);
    return surveyJson;
  }
};

// Synchronous version for backward compatibility
export const getLatestQuestionnaireDataSync = () => {
  try {
    // Just check localStorage
    const savedData = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
    if (savedData) {
      // Remove the id property which is only used in the admin UI
      const pages: QuestionPage[] = JSON.parse(savedData);

      // Create new array without the id property
      const cleanedPages = pages.map((page) => ({
        title: page.title,
        elements: page.elements,
      }));

      // Return the complete survey configuration with updated pages
      return {
        ...surveyJson,
        pages: cleanedPages,
      };
    }
    return surveyJson;
  } catch (error) {
    console.error("Error retrieving questionnaire data:", error);
    return surveyJson;
  }
};
