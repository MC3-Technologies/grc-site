// Mock implementation for storage functions
const mockStorageData = new Map<string, Blob>();

export const uploadData = jest.fn(async ({ path, data }) => {
  mockStorageData.set(path, data as Blob);
  return {
    result: {
      path,
      key: path,
    },
  };
});

export const downloadData = jest.fn(async ({ path }) => {
  const data = mockStorageData.get(path);
  if (!data) {
    throw new Error(`File not found at path: ${path}`);
  }
  
  return {
    result: {
      body: {
        text: async () => {
          return data instanceof Blob ? await data.text() : JSON.stringify(data);
        }
      }
    }
  };
});

export const remove = jest.fn(async ({ path }) => {
  if (!mockStorageData.has(path)) {
    throw new Error(`File not found for deletion at path: ${path}`);
  }
  mockStorageData.delete(path);
  return { path };
});

// Utility function for tests to reset mock storage
export const __resetMockStorage = () => {
  mockStorageData.clear();
  uploadData.mockClear();
  downloadData.mockClear();
  remove.mockClear();
};

// Utility to pre-populate mock storage with test data
export const __setMockStorageItem = (path: string, data: any) => {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  mockStorageData.set(path, blob);
}; 