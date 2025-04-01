import { surveyJson } from "../assessmentQuestions";
import { downloadData, uploadData, list, remove } from "aws-amplify/storage";

// Constant for localStorage key
export const QUESTIONNAIRE_STORAGE_KEY = "admin-questionnaire-data";

// S3 storage paths
export const QUESTIONNAIRE_FOLDER_PATH = "questionnaire";
export const QUESTIONNAIRE_CURRENT_PATH = `${QUESTIONNAIRE_FOLDER_PATH}/current.json`;
export const QUESTIONNAIRE_VERSIONS_PATH = `${QUESTIONNAIRE_FOLDER_PATH}/versions`;

// Version metadata interface
export interface VersionMetadata {
  version: string;
  lastUpdated: string;
  updatedBy: string;
  changeNotes: string;
}

// Version info interface
export interface VersionInfo extends VersionMetadata {
  path: string;
}

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

// Full questionnaire data interface
export interface QuestionnaireData {
  pages: SurveyPage[];
  version: string;
  lastUpdated: string;
  updatedBy: string;
  changeNotes?: string;
}

// Function to get empty questionnaire metadata
const getEmptyVersionMetadata = (): VersionMetadata => {
  return {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    updatedBy: "admin",
    changeNotes: "Initial version",
  };
};

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

// Function to create a new version
export const createNewVersion = async (
  pages: QuestionPage[],
  metadata: VersionMetadata
): Promise<boolean> => {
  try {
    // Get existing versions to determine next version number if not provided
    if (!metadata.version) {
      const versions = await listVersions();
      const versionNumbers = versions
        .map(v => parseFloat(v.version))
        .sort((a, b) => b - a);
      
      const newVersion = versionNumbers.length ? (versionNumbers[0] + 0.1).toFixed(1) : "1.0";
      metadata.version = newVersion;
    }

    // Clean up the pages to remove admin-specific fields
    const cleanedPages = pages.map((page) => ({
      title: page.title,
      elements: page.elements,
    }));

    // Create the full questionnaire object
    const questionnaireData: QuestionnaireData = {
      ...surveyJson,
      pages: cleanedPages,
      version: metadata.version,
      lastUpdated: metadata.lastUpdated,
      updatedBy: metadata.updatedBy,
      changeNotes: metadata.changeNotes || "",
    };

    // Convert to JSON and create file
    const jsonString = JSON.stringify(questionnaireData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const versionFile = new File([blob], `v${metadata.version.replace(".", "_")}.json`, {
      type: "application/json",
    });

    // Upload to S3 versions folder
    const versionPath = `${QUESTIONNAIRE_VERSIONS_PATH}/v${metadata.version.replace(".", "_")}.json`;
    await uploadData({
      path: versionPath,
      data: versionFile,
      options: { bucket: "assessmentStorage" },
    }).result;

    // Also update the current.json to point to this version
    await setCurrentVersion(metadata.version);

    console.log(`Successfully created version ${metadata.version}`);
    return true;
  } catch (error) {
    console.error("Error creating new version:", error);
    return false;
  }
};

// Function to set the current version
export const setCurrentVersion = async (version: string): Promise<boolean> => {
  try {
    // First, save current edits to the current version
    const currentLocalData = loadSavedQuestionnaire();
    const currentVersionInfo = await getCurrentVersionInfo();
    
    // If we have local data and a current version, save before switching
    if (currentLocalData && currentVersionInfo && currentVersionInfo.version !== version) {
      await saveVersionToS3(currentVersionInfo.version, currentLocalData);
    }
    
    // Now load the requested version file from S3
    const versionPath = `${QUESTIONNAIRE_VERSIONS_PATH}/v${version.replace(".", "_")}.json`;
    const result = await downloadData({
      path: versionPath,
      options: { bucket: "assessmentStorage" },
    }).result;
    
    const versionData = await result.body.text();
    
    // Set as current.json in S3
    const blob = new Blob([versionData], { type: "application/json" });
    const currentFile = new File([blob], "current.json", {
      type: "application/json",
    });

    await uploadData({
      path: QUESTIONNAIRE_CURRENT_PATH,
      data: currentFile,
      options: { bucket: "assessmentStorage" },
    }).result;

    // Update localStorage with the loaded version's content
    const parsedData = JSON.parse(versionData) as QuestionnaireData;
    const pages = parsedData.pages.map((page, index) => ({
      ...page,
      id: `page-${index}`,
    }));
    
    localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(pages));

    console.log(`Successfully set current version to ${version}`);
    return true;
  } catch (error) {
    console.error(`Error setting current version to ${version}:`, error);
    return false;
  }
};

// Helper function to save the current localStorage questionnaire data to a specific version
export const saveVersionToS3 = async (version: string, pages: QuestionPage[]): Promise<boolean> => {
  try {
    console.log(`Starting save for version ${version}...`);
    
    // Clean up the pages to remove admin-specific fields
    const cleanedPages = pages.map((page) => ({
      title: page.title,
      elements: page.elements,
    }));
    
    // Path for this version
    const versionPath = `${QUESTIONNAIRE_VERSIONS_PATH}/v${version.replace(".", "_")}.json`;
    
    // Try to get existing version data to preserve metadata
    let versionData: QuestionnaireData;
    
    try {
      const result = await downloadData({
        path: versionPath,
        options: { bucket: "assessmentStorage" },
      }).result;
      
      const versionDataText = await result.body.text();
      versionData = JSON.parse(versionDataText) as QuestionnaireData;
    } catch { 
      // If we can't find the version, create new metadata
      console.log(`Creating new version data for ${version}`);
      versionData = {
        ...surveyJson,
        pages: [],
        version: version,
        lastUpdated: new Date().toISOString(),
        updatedBy: "admin",
        changeNotes: "Auto-saved version",
      };
    }
    
    // Update the questionnaire data with new pages
    versionData.pages = cleanedPages;
    versionData.lastUpdated = new Date().toISOString();
    
    // Save to S3
    const jsonString = JSON.stringify(versionData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const updatedFile = new File([blob], `v${version.replace(".", "_")}.json`, {
      type: "application/json",
    });
    
    await uploadData({
      path: versionPath,
      data: updatedFile,
      options: { bucket: "assessmentStorage" },
    }).result;
    
    console.log(`Successfully saved changes to version ${version}`);
    
    // Also update the current.json if this is the current version
    const currentVersionInfo = await getCurrentVersionInfo();
    if (currentVersionInfo?.version === version) {
      const currentFile = new File([jsonString], "current.json", {
        type: "application/json",
      });
      
      await uploadData({
        path: QUESTIONNAIRE_CURRENT_PATH,
        data: currentFile,
        options: { bucket: "assessmentStorage" },
      }).result;
      
      console.log(`Updated current.json to version ${version}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving version ${version}:`, error);
    return false;
  }
};

// Function to delete a specific version
export const deleteVersion = async (version: string): Promise<boolean> => {
  try {
    // Get all versions to check if we're trying to delete the only version
    const versions = await listVersions();
    
    // Don't allow deleting if there's only one version
    if (versions.length <= 1) {
      console.error("Cannot delete the only existing version");
      return false;
    }
    
    // Check if deleting current version
    const currentVersionInfo = await getCurrentVersionInfo();
    const isCurrentVersion = currentVersionInfo?.version === version;
    
    // If trying to delete current version, switch to another version first
    if (isCurrentVersion) {
      // Find another version to switch to
      const alternateVersion = versions.find(v => v.version !== version);
      if (alternateVersion) {
        // Set alternate as current version
        await setCurrentVersion(alternateVersion.version);
      } else {
        console.error("No alternative version found to switch to");
        return false;
      }
    }
    
    // Delete the version file
    const versionPath = `${QUESTIONNAIRE_VERSIONS_PATH}/v${version.replace(".", "_")}.json`;
    await remove({
      path: versionPath,
      options: { bucket: "assessmentStorage" },
    });
    
    console.log(`Successfully deleted version ${version}`);
    return true;
  } catch (error) {
    console.error(`Error deleting version ${version}:`, error);
    return false;
  }
};

// Function to list all versions
export const listVersions = async (): Promise<VersionInfo[]> => {
  try {
    const listResult = await list({
      path: QUESTIONNAIRE_VERSIONS_PATH, 
      options: { bucket: "assessmentStorage" }
    });
    const { items } = listResult;

    // Process each version file to extract metadata
    const versions: VersionInfo[] = [];
    
    for (const item of items) {
      // The file path is stored in item.path for S3 items
      if (item.path.endsWith('.json')) {
        try {
          const result = await downloadData({
            path: item.path,
            options: { bucket: "assessmentStorage" },
          }).result;
          
          const data = await result.body.text();
          const parsedData = JSON.parse(data) as QuestionnaireData;
          
          versions.push({
            version: parsedData.version,
            lastUpdated: parsedData.lastUpdated,
            updatedBy: parsedData.updatedBy,
            changeNotes: parsedData.changeNotes || "",
            path: item.path
          });
        } catch (e) {
          console.error(`Error processing version file ${item.path}:`, e);
        }
      }
    }
    
    // Sort by version (newest first)
    return versions.sort((a, b) => 
      parseFloat(b.version) - parseFloat(a.version)
    );
  } catch (error) {
    console.error("Error listing versions:", error);
    return [];
  }
};

// Function to save questionnaire to S3
export const saveQuestionnaireToS3 = async (
  pages: QuestionPage[],
  metadata?: Partial<VersionMetadata>
): Promise<boolean> => {
  try {
    // Get current version info to determine where to save
    const currentVersionInfo = await getCurrentVersionInfo();
    if (!currentVersionInfo) {
      console.error("No current version found");
      return false;
    }
    
    // If we're creating a new version explicitly (metadata has version)
    if (metadata?.version) {
      // Create a new version
      return await createNewVersion(pages, metadata as VersionMetadata);
    } else {
      // We're saving to the current version
      return await saveVersionToS3(currentVersionInfo.version, pages);
    }
  } catch (error) {
    console.error("Error saving questionnaire to S3:", error);
    return false;
  }
};

// Function to load a specific version directly
export const loadQuestionnaireVersion = async (version: string): Promise<QuestionPage[] | null> => {
  try {
    const versionPath = `${QUESTIONNAIRE_VERSIONS_PATH}/v${version.replace(".", "_")}.json`;
    const result = await downloadData({
      path: versionPath,
      options: { bucket: "assessmentStorage" },
    }).result;
    
    const versionData = await result.body.text();
    const parsedData = JSON.parse(versionData) as QuestionnaireData;
    
    // Convert to editor format with ids
    const pages = parsedData.pages.map((page, index) => ({
      ...page,
      id: `page-${index}`,
    }));
    
    // Update localStorage with this version's data
    localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(pages));
    
    return pages;
  } catch (error) {
    console.error(`Error loading questionnaire version ${version}:`, error);
    return null;
  }
};

// Function to fetch questionnaire from S3
export const fetchQuestionnaireFromS3 = async (version?: string) => {
  try {
    // If version specified, get that specific version
    const path = version 
      ? `${QUESTIONNAIRE_VERSIONS_PATH}/v${version.replace(".", "_")}.json`
      : QUESTIONNAIRE_CURRENT_PATH;

    // Download from S3
    const result = await downloadData({
      path: path,
      options: { bucket: "assessmentStorage" },
    }).result;

    // Parse JSON
    const questionnaireJson = await result.body.text();
    return JSON.parse(questionnaireJson);
  } catch (error) {
    console.error(`Error fetching questionnaire from S3 ${version ? `(version ${version})` : ''}:`, error);
    return null;
  }
};

// Function to get current version metadata
export const getCurrentVersionInfo = async (): Promise<VersionInfo | null> => {
  try {
    // Download current version
    const result = await downloadData({
      path: QUESTIONNAIRE_CURRENT_PATH,
      options: { bucket: "assessmentStorage" },
    }).result;

    // Parse JSON
    const questionnaireJson = await result.body.text();
    const parsedData = JSON.parse(questionnaireJson) as QuestionnaireData;
    
    return {
      version: parsedData.version,
      lastUpdated: parsedData.lastUpdated,
      updatedBy: parsedData.updatedBy,
      changeNotes: parsedData.changeNotes || "",
      path: QUESTIONNAIRE_CURRENT_PATH
    };
  } catch (error) {
    console.error("Error getting current version info:", error);
    return null;
  }
};

// Initialize the versioning system (run once at startup if needed)
export const initializeVersioning = async (): Promise<boolean> => {
  try {
    // Check if there are any versions
    const versions = await listVersions();
    
    if (versions.length === 0) {
      // No versions exist, create the first one from the default questionnaire
      console.log("No questionnaire versions found. Creating initial version.");
      
      // Create pages from default survey
      const pages = surveyJson.pages.map((page: SurveyPage, index: number) => ({
        ...page,
        id: `page-${index}`,
      }));
      
      // Create first version
      return await createNewVersion(pages, getEmptyVersionMetadata());
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing versioning:", error);
    return false;
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

// Create a new utility function in questionnaireUtils.ts

export const getAssessmentQuestionnaire = async (assessmentData: unknown) => {
  // If the assessment has stored questionnaire data, use that
  if (assessmentData && typeof assessmentData === 'object' && 'questionnaire' in assessmentData) {
    console.log("Using questionnaire stored with assessment");
    return (assessmentData as Record<string, unknown>).questionnaire;
  }
  
  // For backward compatibility with older assessments that don't have the stored questionnaire
  console.log("Using latest questionnaire (compatibility mode)");
  return await getLatestQuestionnaireData();
};
