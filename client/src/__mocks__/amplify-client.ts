// Mock implementation for the Amplify client schema models

// Define more specific interfaces to replace 'any'
interface AssessmentItem {
  id: string;
  userId?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  currentPage?: number;
  percentCompleted?: number;
  schemeId?: string;
  status?: string;
  score?: number;
  [key: string]: unknown;
}

// Mock storage for database records
const mockInProgressAssessments = new Map<string, AssessmentItem>();
const mockCompletedAssessments = new Map<string, AssessmentItem>();

// Define a type that matches what our tests are expecting
type ModelItem = Record<string, unknown> & {
  id: string; // Ensure id is always a string
};

const createMockModel = (storage: Map<string, ModelItem>) => {
  return {
    create: jest.fn(async (item: ModelItem) => {
      storage.set(item.id, {
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      });
      return { data: storage.get(item.id), errors: null };
    }),

    update: jest.fn(async (item: ModelItem) => {
      if (!storage.has(item.id)) {
        return { data: null, errors: [{ message: "Item not found" }] };
      }
      const existingItem = storage.get(item.id);
      const updatedItem = {
        ...existingItem,
        ...item,
        updatedAt: new Date().toISOString(),
      };
      storage.set(item.id, updatedItem);
      return { data: updatedItem, errors: null };
    }),

    delete: jest.fn(async ({ id }: { id: string }) => {
      if (!storage.has(id)) {
        return { errors: [{ message: "Item not found" }] };
      }
      storage.delete(id);
      return { errors: null };
    }),

    get: jest.fn(async ({ id }: { id: string }) => {
      const item = storage.get(id);
      if (!item) {
        return { data: null, errors: [{ message: "Item not found" }] };
      }
      return { data: item, errors: null };
    }),

    list: jest.fn(async () => {
      return { data: Array.from(storage.values()), errors: null };
    }),
  };
};

// Create mock client with models
export const MockClient = {
  models: {
    InProgressAssessment: createMockModel(mockInProgressAssessments),
    CompletedAssessment: createMockModel(mockCompletedAssessments),
  },
};

// Reset all mock data
export const __resetMockClient = () => {
  mockInProgressAssessments.clear();
  mockCompletedAssessments.clear();

  // Reset all mock functions
  Object.values(MockClient.models.InProgressAssessment).forEach((fn) => {
    if (typeof fn === "function" && "mockClear" in fn) {
      fn.mockClear();
    }
  });

  Object.values(MockClient.models.CompletedAssessment).forEach((fn) => {
    if (typeof fn === "function" && "mockClear" in fn) {
      fn.mockClear();
    }
  });
};

// Add test data
export const __setMockInProgressAssessment = (assessment: AssessmentItem) => {
  mockInProgressAssessments.set(assessment.id, assessment);
  return assessment;
};

export const __setMockCompletedAssessment = (assessment: AssessmentItem) => {
  mockCompletedAssessments.set(assessment.id, assessment);
  return assessment;
};
