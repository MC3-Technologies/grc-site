import { useState, useEffect } from "react";
import { VersionInfo, listVersions, setCurrentVersion, getCurrentVersionInfo, deleteVersion, loadQuestionnaireVersion, saveVersionToS3, loadSavedQuestionnaire, QUESTIONNAIRE_STORAGE_KEY } from "../../utils/questionnaireUtils";

interface VersionManagerProps {
  onCreateVersion: () => void;
  onRefresh: () => void;
}

const VersionManager: React.FC<VersionManagerProps> = ({ onCreateVersion, onRefresh }) => {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [currentVersion, setCurrentVersionState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionVersion, setActionVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null);

  // Load versions
  const loadVersions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all versions
      const versionsList = await listVersions();
      setVersions(versionsList);
      
      // Get current version
      const currentVersionInfo = await getCurrentVersionInfo();
      if (currentVersionInfo) {
        setCurrentVersionState(currentVersionInfo.version);
      }
    } catch (err) {
      console.error("Error loading versions:", err);
      setError("Failed to load questionnaire versions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    loadVersions();
  }, []);

  // Handle selecting a version
  const handleUseVersion = async (version: string) => {
    try {
      setActionLoading(true);
      
      // First save any current changes to the current version
      const currentVersionInfo = await getCurrentVersionInfo();
      const savedData = loadSavedQuestionnaire();
      
      if (currentVersionInfo && savedData) {
        await saveVersionToS3(currentVersionInfo.version, savedData);
      }
      
      // Now set the selected version as current
      const success = await setCurrentVersion(version);
      
      if (success) {
        // Force reload the content for this version from S3
        const loadedData = await loadQuestionnaireVersion(version);
        
        if (loadedData) {
          // Update localStorage with the freshly loaded data
          localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(loadedData));
        }
        
        // Refresh the versions list
        await loadVersions();
        setSuccess(`Successfully set current version to ${version}`);
        onRefresh(); // This will tell AdminQuestionnaire to refresh its state
      } else {
        setError(`Failed to set version ${version} as current`);
      }
    } catch (error) {
      console.error(`Error setting version ${version}:`, error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Show delete confirmation modal
  const promptDeleteVersion = (version: string) => {
    setVersionToDelete(version);
    setShowDeleteModal(true);
  };
  
  // Handle delete confirmation
  const confirmDeleteVersion = async () => {
    if (!versionToDelete) return;
    
    // Close modal
    setShowDeleteModal(false);
    
    // Begin delete process
    setActionLoading(true);
    setActionVersion(versionToDelete);
    setError(null);
    
    try {
      const success = await deleteVersion(versionToDelete);
      
      if (success) {
        setSuccess(`Successfully deleted version ${versionToDelete}`);
        
        // Reload versions list
        await loadVersions();
        
        // Clear success message after a delay
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
        
        // Refresh parent component
        onRefresh();
      } else {
        setError(`Failed to delete version ${versionToDelete}.`);
      }
    } catch (err) {
      console.error(`Error deleting version ${versionToDelete}:`, err);
      setError(`Error deleting version ${versionToDelete}. Please try again.`);
    } finally {
      setActionLoading(false);
      setActionVersion(null);
      setVersionToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDeleteVersion = () => {
    setShowDeleteModal(false);
    setVersionToDelete(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Questionnaire Versions
        </h3>
        <div className="space-x-2">
          <button
            onClick={loadVersions}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="mr-2">Refreshing...</span>
                <span className="animate-spin">↻</span>
              </>
            ) : (
              "Refresh"
            )}
          </button>
          <button
            onClick={onCreateVersion}
            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Create New Version
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-700 dark:bg-opacity-20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-700 dark:bg-opacity-20 dark:text-green-300">
          {success}
        </div>
      )}

      {/* Versions list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-primary-600 animate-spin w-6 h-6 mr-2">↻</div>
          <span className="text-gray-500 dark:text-gray-400">
            Loading versions...
          </span>
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          No versions found. Create your first version to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version) => (
            <div
              key={version.version}
              className={`p-4 border rounded-lg ${
                version.version === currentVersion
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900 dark:bg-opacity-20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Version {version.version}
                    </h4>
                    {version.version === currentVersion && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:bg-opacity-50 dark:text-green-300">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Updated on{" "}
                    {new Date(version.lastUpdated).toLocaleDateString()} by{" "}
                    {version.updatedBy}
                  </p>
                  {version.changeNotes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Change notes:</span>{" "}
                      {version.changeNotes}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {version.version !== currentVersion && (
                    <button
                      onClick={() => handleUseVersion(version.version)}
                      disabled={actionLoading}
                      className={`px-3 py-1 text-sm font-medium rounded-lg ${
                        actionLoading && actionVersion === version.version
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {actionLoading && actionVersion === version.version ? (
                        <>
                          <span className="animate-spin mr-1">↻</span> Setting...
                        </>
                      ) : (
                        "Use This Version"
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => promptDeleteVersion(version.version)}
                    disabled={actionLoading || versions.length <= 1}
                    className={`px-3 py-1 text-sm font-medium rounded-lg ${
                      actionLoading && actionVersion === version.version
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                        : versions.length <= 1
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                    title={versions.length <= 1 ? "Cannot delete the only version" : ""}
                  >
                    {actionLoading && actionVersion === version.version ? (
                      <>
                        <span className="animate-spin mr-1">↻</span> Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Modal (Inline) */}
      {showDeleteModal && versionToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="relative p-4 w-full max-w-md max-h-full">
            {/* Modal content */}
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Version Deletion
                </h3>
                <button
                  type="button"
                  onClick={cancelDeleteVersion} // Use cancel handler
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <span className="sr-only">Close modal</span>✕
                </button>
              </div>
              {/* Modal body */}
              <div className="p-4 md:p-5">
                <div className="mb-4 text-center">
                  {/* Warning Icon */}
                  <svg
                    className="w-12 h-12 mx-auto text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                  <h3 className="mt-4 mb-2 text-lg font-medium text-gray-800 dark:text-gray-300">
                    Are you sure you want to delete this version?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You are about to delete version{" "}
                    <span className="font-bold">{versionToDelete}</span>. This
                    action cannot be undone.
                  </p>
                </div>
                {/* Modal footer */}
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={cancelDeleteVersion} // Use cancel handler
                    className="text-gray-500 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteVersion} // Use confirm handler
                    className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                  >
                    Yes, Delete Version
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionManager; 