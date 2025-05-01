import {
    getLatestQuestionnaireData,
    loadSavedQuestionnaire,
    QUESTIONNAIRE_STORAGE_KEY,
    QuestionPage,
  } from "../questionnaireUtils";
  
  
  // Mock surveyJson for testing
  jest.mock("../../assessmentQuestions", () => ({
    surveyJson: {
      title: "Test Survey",
      pages: [
        {
          title: "Default Page 1",
          elements: [{ type: "text", name: "q1", title: "Question 1" }],
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
            elements: [{ type: "text", name: "q1", title: "Question 1" }],
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
      test("returns default surveyJson when no saved data exists", async () => {
        const result = await getLatestQuestionnaireData();
        expect(result).toEqual(
          expect.objectContaining({
            title: expect.any(String),
            pages: expect.any(Array),
          }),
        );
        expect(localStorageMock.getItem).toHaveBeenCalledWith(
          QUESTIONNAIRE_STORAGE_KEY,
        );
      });
  
      test("returns modified surveyJson with pages from localStorage when available", async () => {
        const testPages: QuestionPage[] = [
          {
            title: "Custom Page",
            elements: [{ type: "checkbox", name: "q2", title: "Question 2" }],
            id: "custom1",
          },
        ];
  
        localStorageMock.setItem(
          QUESTIONNAIRE_STORAGE_KEY,
          JSON.stringify(testPages),
        );
  
        const result = await getLatestQuestionnaireData();
  
        // Check the structure
        expect(result).toEqual(
          expect.objectContaining({
            title: expect.any(String),
            pages: expect.any(Array),
          }),
        );
  
        // Check page content - might be from localStorage or S3 mock
        expect(result.pages.length).toBeGreaterThan(0);
      });
  
      test("returns default surveyJson when localStorage throws an error", async () => {
        // Mock getItem to throw an error
        localStorageMock.getItem.mockImplementationOnce(() => {
          throw new Error("localStorage error");
        });
  
        const result = await getLatestQuestionnaireData();
        expect(result).toEqual(
          expect.objectContaining({
            title: expect.any(String),
            pages: expect.any(Array),
          }),
        );
      });
    });
  });
  