import { uploadData, downloadData } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import { surveyJson } from "../assessmentQuestions";
import { Model } from "survey-core";
import { getClientSchema } from "../amplify/schema";
import { remove } from "aws-amplify/storage";

// In progress assessment class
class InProgressAssessment {
  private client: ReturnType<typeof getClientSchema>;

  constructor() {
    this.client = getClientSchema();
  }

  // ** PUBLIC METHODS TO BE USED IN OTHER FILES ** //

  // Delete assessment by id -> delete database entry and storage data
  public deleteAssessment = async (id: string): Promise<void> => {
    // Temp copy of assessment storage path before we delete the entry
    const path = await this._fetchAssessmentStoragePath(id);

    // Delete assessment entry from database
    await this._deleteAssessmentEntry(id).catch((err) => {
      throw new Error(`Error deleting assessment from database: ${err}`);
    });

    // Delete assessment JSON from storage
    await this._deleteAssessmentFromStorage(path).catch((err) => {
      throw new Error(`Error deleting assessment JSON from storage: ${err}`);
    });

    console.info("Successfully deleted assessment");
  };

  // Fetch assessment data using assessment id (hash)
  public fetchAssessmentData = async (
    id: string
  ): Promise<{
    id: string;
    name: string;
    currentPage: number;
    percentCompleted: number;
    storagePath: string;
    version: string;
    owner: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
  }> => {
    try {
      // Fetch data
      const { data, errors } =
        await this.client.models.InProgressAssessment.get({ id });

      // If errors or data fromf fetching, throw errors
      if (errors) {
        throw new Error(`Error fetching in-progress assessments: ${errors}`);
      }
      if (!data) {
        throw new Error("No data found from query!");
      }
      return data;
    } catch (err) {
      throw new Error(`Error fetching in-progress assessments: ${err}`);
    }
  };

  // Fetch JSON assessment data from storage
  public fetchAssessmentStorageData = async <T = unknown>(
    id: string
  ): Promise<T> => {
    // Fetch assessment storage path fromd database using id
    const storagePath = await this._fetchAssessmentStoragePath(id).catch(
      (err) => {
        throw new Error(`Error getting storage path from database: ${err}`);
      }
    );

    // Use storage path from above to call storage download
    const assessmentJson = await this._fetchAssessmentStorageJson(
      storagePath
    ).catch((err) => {
      throw new Error(`Error getting assessment storage: ${err}`);
    });

    // Return assessment data
    return assessmentJson as T;
  };

  // Fetch all assessments (in progress)
  public fetchAllAssessments = async (): Promise<
    {
      id: string;
      name: string;
      percentCompleted: number;
      storagePath: string;
      version: string;
      owner: string | null;
      readonly createdAt: string;
      readonly updatedAt: string;
    }[]
  > => {
    try {
      // Fetch all assessments list
      const { data, errors } =
        await this.client.models.InProgressAssessment.list();
      // Throw error if errors
      if (errors) {
        throw new Error(`Error fetching in-progress assessments: ${errors}`);
      }
      return data;
    } catch (err) {
      throw new Error(`Error fetching in-progress assessments: ${err}`);
    }
  };

  public createAssessment = async (name: string): Promise<void> => {
    // Create hash to use for id
    const idHash = this._generateUrlSafeHash();

    // Create new assessment instance and assessment JSON to upload
    const jsonString = JSON.stringify(new Model(surveyJson).data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], `${idHash}.json`, {
      type: "application/json",
    });

    // Upload new assessment JSON and get back path
    const storageUploadPath = await this._uploadAssessmentToStorage(file).catch(
      (err) => {
        throw new Error(`Error uploading new assessment to storage: ${err}`);
      }
    );

    // Create new assessment database entry using storage upload path
    await this._createAssessmentEntry(idHash, name, storageUploadPath).catch(
      (err) => {
        throw new Error(`Error creating new assessment entry: ${err}`);
      }
    );
  };

  // ** PRIVATE METHODS TO BE USED IN PUBLIC FUNCTIONS ** //

  // Create assessment database entry
  private _createAssessmentEntry = async (
    hash: string,
    name: string,
    path: string
  ) => {
    // New assessment entry obkect
    try {
      const newAssessment = {
        id: hash,
        name,
        currentPage: 0,
        percentCompleted: 0,
        storagePath: path,
        version: "1",
      };

      // If errors, handle
      const { errors, data } =
        await this.client.models.InProgressAssessment.create(newAssessment);
      if (errors) {
        throw new Error(`Error creating new assessment: ${errors}`);
      }
      console.log(`Successfully created new assessment: ${data}`);
    } catch (e) {
      throw new Error(`${e}`);
    }
  };

  // Delete assessment entry from database by id
  private _deleteAssessmentEntry = async (id: string): Promise<void> => {
    const toBeDeletedAssessment = { id };

    try {
      // Delete database entry
      const deleteResult = await this.client.models.InProgressAssessment.delete(
        toBeDeletedAssessment
      );
      // Handle errors
      if (deleteResult.errors) {
        throw new Error(`Error deleting assessment: ${deleteResult.errors}`);
      }
    } catch (err) {
      throw new Error(`Error deleting assessment: ${err}`);
    }
  };

  // Return JSON assessment data from storage give storage path
  private _fetchAssessmentStorageJson = async (
    path: string
  ): Promise<unknown> => {
    try {
      // Fetch assessment json and parse into texty
      const assessmentDownloadResult = await downloadData({
        path,
        options: { bucket: "assessmentStorage" },
      }).result;
      const assessmentJson = await assessmentDownloadResult.body.text();

      // Return
      return assessmentJson;
    } catch (err) {
      throw new Error(`Error downloading assessment data: ${err}`);
    }
  };

  // Get assessment storage path from database entry
  private _fetchAssessmentStoragePath = async (id: string): Promise<string> => {
    try {
      const { data, errors } =
        // Get assessment database entry
        await this.client.models.InProgressAssessment.get({ id });
      // If errors or no data, throw error
      if (errors) {
        throw new Error(`Error fetching in-progress assessments: ${errors}`);
      }
      if (!data) {
        throw new Error("No data found from query!");
      }
      // Return storage path
      return data.storagePath;
    } catch (err) {
      throw new Error(`Error fetching in-progress assessments: ${err}`);
    }
  };

  // Upload assessment data file to storage
  private _uploadAssessmentToStorage = async (
    assessment: File
  ): Promise<string> => {
    // If no assessment found from param, throw error
    if (!assessment) {
      throw new Error("No assessment found");
    }

    // Fetch session to use session id in storage path
    const session = await fetchAuthSession();
    if (!session.identityId) {
      throw new Error(`No session identity found!`);
    }

    try {
      // Upload data to bucket
      const res = await uploadData({
        path: `assessments/${session.identityId}/in-progress/${assessment.name}`,
        data: assessment,
        options: { bucket: "assessmentStorage" },
      }).result;
      console.log("Assessment uploaded successfully", res);
      // Return path of uploaded blob
      return res.path;
    } catch (e) {
      throw new Error(`Error uploading assessment: ${e}`);
    }
  };

  // Delete assessment from storage given the path
  private _deleteAssessmentFromStorage = async (
    path: string
  ): Promise<void> => {
    try {
      // Delete from storage
      await remove({
        path,
        options: { bucket: "assessmentStorage" },
      });
    } catch (error) {
      throw new Error(
        `Error deleting assessment JSON blob from storage: ${error}`
      );
    }
  };

  // Generate URL safe hash to use for assessment ids (negligable collision chances)
  private _generateUrlSafeHash = (): string => {
    // Characters to use in hash
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let result = "";
    // Build random hash string
    for (let i = 0; i < 16; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    // Return result
    return result;
  };
}

// Completed assessment class
class CompletedAssessment {
  private client: ReturnType<typeof getClientSchema>;

  constructor() {
    this.client = getClientSchema();
  }

  // ** PUBLIC METHODS TO BE USED IN OTHER FILES ** //

  // Fetch all completed assessments
  public fetchAllCompletedAssessments = async (): Promise<
    {
      id: string;
      name: string;
      organizationName: string;
      status: string;
      completedAt: string;
      complianceScore: number;
      isCompliant: boolean;
      storagePath: string;
      version: string;
      owner: string | null;
      readonly createdAt: string;
      readonly updatedAt: string;
    }[]
  > => {
    try {
      // Fetch all completed assessments
      const { data, errors } =
        await this.client.models.CompletedAssessment.list();
      // If errors, throw error
      if (errors) {
        throw new Error(`Error fetching completed assessments: ${errors}`);
      }
      // Returned fetched data
      return data;
    } catch (err) {
      throw new Error(`Error fetching completed assessments: ${err}`);
    }
  };
}

export { InProgressAssessment, CompletedAssessment };
