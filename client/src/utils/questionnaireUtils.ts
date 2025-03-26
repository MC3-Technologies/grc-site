import { surveyJson } from "../assessmentQuestions";

// Constant for localStorage key
export const QUESTIONNAIRE_STORAGE_KEY = "admin-questionnaire-data";

// Survey element types
export interface SurveyElement {
  type: string;
  name?: string;
  title?: string;
  description?: string;
  isRequired?: boolean;
  visibleIf?: string;
  choices?: Array<string | ChoiceItem>;
}

// Choice item type for multiple choice questions
export interface ChoiceItem {
  value: string | number;
  text: string;
}

// Interface for questionnaire page
export interface QuestionPage {
  title: string;
  elements: SurveyElement[];
  id: string;
}

// Interface for original survey page before adding ID
export interface SurveyPage {
  title: string;
  elements: SurveyElement[];
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

// Export the questionnaire data for other components to use
export const getLatestQuestionnaireData = () => {
  try {
    const savedData = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
    if (savedData) {
      // Remove the id property which is only used in the admin UI
      const pages: QuestionPage[] = JSON.parse(savedData);
      
      // Create new array without the id property
      const cleanedPages = pages.map(page => {
        // Create a new object with just title and elements
        return {
          title: page.title,
          elements: page.elements
        };
      });
      
      // Return the complete survey configuration with updated pages
      return {
        ...surveyJson,
        pages: cleanedPages
      };
    }
    return surveyJson;
  } catch (error) {
    console.error("Error retrieving questionnaire data:", error);
    return surveyJson;
  }
}; 