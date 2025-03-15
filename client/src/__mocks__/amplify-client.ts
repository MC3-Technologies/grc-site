// Mock implementation for the Amplify client schema models

// Define types for assessments
interface BaseAssessment {
  id: string;
  name: string;
  storagePath: string;
  version: string;
  owner: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface InProgressAssessmentModel extends BaseAssessment {
  currentPage: number;
  percentCompleted: number;
  startedAt: string;
}

interface CompletedAssessmentModel extends BaseAssessment {
  completedAt: string;
  complianceScore: number;
  isCompliant: boolean;
  duration: number;
}

// Type for database model items
type ModelItem = InProgressAssessmentModel | CompletedAssessmentModel;

// Mock storage for database records
const mockInProgressAssessments = new Map<string, InProgressAssessmentModel>();
const mockCompletedAssessments = new Map<string, CompletedAssessmentModel>();

const createMockModel = <T extends ModelItem>(storage: Map<string, T>) => {
  return {
    create: jest.fn(async (item: T) => {
      storage.set(item.id, {
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      } as T);
      return { data: storage.get(item.id), errors: null };
    }),

    update: jest.fn(async (item: Partial<T> & { id: string }) => {
      if (!storage.has(item.id)) {
        return { data: null, errors: [{ message: "Item not found" }] };
      }
      const existingItem = storage.get(item.id)!;
      const updatedItem = {
        ...existingItem,
        ...item,
        updatedAt: new Date().toISOString(),
      } as T;
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
    InProgressAssessment: createMockModel<InProgressAssessmentModel>(mockInProgressAssessments),
    CompletedAssessment: createMockModel<CompletedAssessmentModel>(mockCompletedAssessments),
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
export const __setMockInProgressAssessment = (assessment: Partial<InProgressAssessmentModel> & { id: string }) => {
  mockInProgressAssessments.set(assessment.id, {
    ...assessment as InProgressAssessmentModel,
    createdAt: assessment.createdAt || new Date().toISOString(),
    updatedAt: assessment.updatedAt || new Date().toISOString(),
  });
};

export const __setMockCompletedAssessment = (assessment: Partial<CompletedAssessmentModel> & { id: string }) => {
  mockCompletedAssessments.set(assessment.id, {
    ...assessment as CompletedAssessmentModel,
    createdAt: assessment.createdAt || new Date().toISOString(),
    updatedAt: assessment.updatedAt || new Date().toISOString(),
  });
};
