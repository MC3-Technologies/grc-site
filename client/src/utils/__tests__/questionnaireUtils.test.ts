import {
  getLatestQuestionnaireData,
  loadSavedQuestionnaire,
  QUESTIONNAIRE_STORAGE_KEY,
  QuestionPage,
} from "../questionnaireUtils";
import { surveyJson } from "../../assessmentQuestions";

// Mock surveyJson for testing
jest.mock("../../assessmentQuestions", () => ({
  surveyJson: {
    title: "Test Survey",
    pages: [
      {
        title: "Default Page 1",
        elements: [{ type: "text", name: "q1" }],
      },
    ],
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

describe("Questionnaire Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    // Suppress console.error for expected error tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore mocks
    jest.restoreAllMocks();
  });

  describe("loadSavedQuestionnaire", () => {
    test("returns null when no data in localStorage", () => {
      const result = loadSavedQuestionnaire();
      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        QUESTIONNAIRE_STORAGE_KEY,
      );
    });

    test("returns parsed data from localStorage when available", () => {
      const testPages: QuestionPage[] = [
        {
          title: "Test Page",
          elements: [{ type: "text", name: "q1" }],
          id: "test1",
        },
      ];

      localStorageMock.setItem(
        QUESTIONNAIRE_STORAGE_KEY,
        JSON.stringify(testPages),
      );

      const result = loadSavedQuestionnaire();
      expect(result).toEqual(testPages);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        QUESTIONNAIRE_STORAGE_KEY,
      );
    });

    test("returns null when localStorage throws an error", () => {
      // Mock getItem to throw an error
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error("localStorage error");
      });

      const result = loadSavedQuestionnaire();
      expect(result).toBeNull();
    });
  });

  describe("getLatestQuestionnaireData", () => {
    test("returns default surveyJson when no saved data exists", () => {
      const result = getLatestQuestionnaireData();
      expect(result).toBe(surveyJson);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        QUESTIONNAIRE_STORAGE_KEY,
      );
    });

    test("returns modified surveyJson with pages from localStorage when available", () => {
      const testPages: QuestionPage[] = [
        {
          title: "Custom Page",
          elements: [{ type: "checkbox", name: "q2" }],
          id: "custom1",
        },
      ];

      localStorageMock.setItem(
        QUESTIONNAIRE_STORAGE_KEY,
        JSON.stringify(testPages),
      );

      const result = getLatestQuestionnaireData();

      // Should contain the survey title from the default surveyJson
      expect(result.title).toBe("Test Survey");

      // But should have custom pages without the id property
      expect(result.pages[0].title).toBe("Custom Page");
      expect(result.pages[0].elements[0].type).toBe("checkbox");
      expect(result.pages[0].elements[0].name).toBe("q2");

      // id property should be removed
      expect(
        (result.pages[0] as unknown as { id?: string }).id,
      ).toBeUndefined();
    });

    test("returns default surveyJson when localStorage throws an error", () => {
      // Mock getItem to throw an error
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error("localStorage error");
      });

      const result = getLatestQuestionnaireData();
      expect(result).toBe(surveyJson);
    });
  });
});
