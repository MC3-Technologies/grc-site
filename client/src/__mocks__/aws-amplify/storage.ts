// Mock implementation for storage functions
const mockStorageData = new Map<string, Blob>();
const mockErrors = new Map<string, Error | null>();

export const uploadData = jest.fn(async ({ path, data }) => {
  const error = mockErrors.get("uploadData");
  if (error) {
    throw error;
  }
  mockStorageData.set(path, data as Blob);
  return {
    result: {
      path,
      key: path,
    },
  };
});

export const downloadData = jest.fn(async ({ path }) => {
  const error = mockErrors.get("downloadData");
  if (error) {
    throw error;
  }

  const data = mockStorageData.get(path);
  if (!data) {
    throw new Error(`File not found at path: ${path}`);
  }

  return {
    result: {
      body: {
        text: async () => {
          return data instanceof Blob
            ? await data.text()
            : JSON.stringify(data);
        },
      },
    },
  };
});

export const remove = jest.fn(async ({ path }) => {
  const error = mockErrors.get("remove");
  if (error) {
    throw error;
  }

  if (!mockStorageData.has(path)) {
    throw new Error(`File not found for deletion at path: ${path}`);
  }
  mockStorageData.delete(path);
  return { path };
});

// Utility function for tests to reset mock storage
export const __resetMockStorage = () => {
  mockStorageData.clear();
  mockErrors.clear();
  uploadData.mockClear();
  downloadData.mockClear();
  remove.mockClear();
};

// Utility to pre-populate mock storage with test data
export const __setMockStorageItem = (path: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  mockStorageData.set(path, blob);
};

// Utility to set mock errors for specific functions
export const __setMockStorageError = (
  functionName: "uploadData" | "downloadData" | "remove",
  error: Error | null,
) => {
  if (error) {
    mockErrors.set(functionName, error);
  } else {
    mockErrors.delete(functionName);
  }
};
