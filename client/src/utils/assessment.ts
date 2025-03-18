import { uploadData, downloadData } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import { surveyJson } from "../assessmentQuestions";
import { Model } from "survey-core";
import { getClientSchema } from "../amplify/schema";
import { remove } from "aws-amplify/storage";

// Assessment class with one global variable and one global in common method : upload assessment data to storage
class Assessment {
  // Client schema attribute
  protected static client = getClientSchema();

  // Upload assessment data file to storage
  protected static _uploadAssessmentToStorage = async (
    assessment: File,
    path: string,
  ): Promise<string> => {
    // If no assessment found from param, throw error
    if (!assessment) {
      throw new Error("No assessment found");
    }

    try {
      // Upload data to bucket
      const res = await uploadData({
        path,
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
  protected static _deleteAssessmentFromStorage = async (
    path: string,
  ): Promise<void> => {
    try {
      // Delete from storage
      await remove({
        path,
        options: { bucket: "assessmentStorage" },
      });
    } catch (error) {
      throw new Error(
        `Error deleting assessment JSON blob from storage: ${error}`,
      );
    }
  };
}

// In progress assessment class
class InProgressAssessment extends Assessment {
  // ** PUBLIC METHODS TO BE USED IN OTHER FILES ** //

  // Update assessment both in database entry and assessment data json storage
  public static updateAssessment = async (
    id: string,
    currentPage: number,
    percentCompleted: number,
    newAssessmentData: File,
  ): Promise<void> => {
    // Get storage path of assessment data blob
    const storagePath = await this._fetchAssessmentStoragePath(id).catch(
      (err) => {
        throw new Error(`Error fetching assessment storage path: ${err}`);
      },
    );

    // Replace storage path with new assessment data
    await this._uploadAssessmentToStorage(newAssessmentData, storagePath).catch(
      (err) => {
        throw new Error(`Error uploading storage to storage: ${err}`);
      },
    );

    // Update database entry with new current page and percent
    await this._updateAssessmentEntry(id, currentPage, percentCompleted).catch(
      (err) => {
        throw new Error(`Error updating assessment database entry: ${err}`);
      },
    );
  };

  // Delete assessment by id -> delete database entry and storage data
  public static deleteAssessment = async (id: string): Promise<void> => {
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
  public static fetchAssessmentData = async (
    id: string,
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
    startedAt: string;
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
  public static fetchAssessmentStorageData = async <T = unknown>(
    id: string,
  ): Promise<T> => {
    // Fetch assessment storage path fromd database using id
    const storagePath = await this._fetchAssessmentStoragePath(id).catch(
      (err) => {
        throw new Error(`Error getting storage path from database: ${err}`);
      },
    );

    // Use storage path from above to call storage download
    const assessmentJson = await this._fetchAssessmentStorageJson(
      storagePath,
    ).catch((err) => {
      throw new Error(`Error getting assessment storage: ${err}`);
    });

    // Return assessment data
    return assessmentJson as T;
  };

  // Fetch all assessments (in progress)
  public static fetchAllAssessments = async (): Promise<
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

  public static createAssessment = async (name: string): Promise<string> => {
    // Fetch session to use session id in storage path
    const session = await fetchAuthSession();
    if (!session.identityId) {
      throw new Error(`No session identity found!`);
    }

    // Create hash to use for id
    const idHash = this._generateUrlSafeHash();

    // Create new assessment JSON to upload
    const jsonString = JSON.stringify(new Model(surveyJson).data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], `${idHash}.json`, {
      type: "application/json",
    });

    // Upload new assessment JSON and get back path
    const storageUploadPath = await this._uploadAssessmentToStorage(
      file,
      `assessments/${session.identityId}/in-progress/${file.name}`,
    ).catch((err) => {
      throw new Error(`Error uploading new assessment to storage: ${err}`);
    });

    // Create new assessment database entry using storage upload path
    const newAssessmentId = await this._createAssessmentEntry(
      idHash,
      name,
      storageUploadPath,
    ).catch((err) => {
      throw new Error(`Error creating new assessment entry: ${err}`);
    });

    // Return new assessment id
    return newAssessmentId;
  };

  // ** PRIVATE METHODS TO BE USED IN PUBLIC FUNCTIONS ** //

  // Update assessment database entry, takes in ID, new current page and new percent completed
  private static _updateAssessmentEntry = async (
    id: string,
    currentPage: number,
    percentCompleted: number,
  ): Promise<void> => {
    // Assessment to be updated
    const updatedAssessment = {
      id,
      currentPage,
      percentCompleted,
    };
    // Updated database entry
    const { data, errors } =
      await this.client.models.InProgressAssessment.update(updatedAssessment);
    // Throw errors if update failed
    if (!data || errors) {
      throw new Error(
        `Error updating assessment with id ${id} : ${errors?.at(0)?.message}`,
      );
    }
  };

  // Create assessment database entry
  private static _createAssessmentEntry = async (
    hash: string,
    name: string,
    path: string,
  ): Promise<string> => {
    // New assessment entry object
    try {
      const newAssessment = {
        id: hash,
        name,
        currentPage: 0,
        percentCompleted: 0,
        storagePath: path,
        version: "1",
        startedAt: new Date().toISOString(),
      };

      // If errors, handle
      const { errors, data } =
        await this.client.models.InProgressAssessment.create(newAssessment);
      if (errors) {
        throw new Error(`Error creating new assessment: ${errors}`);
      }
      if (!data) {
        throw new Error(
          `No data recieved from creating new assessment entry: ${errors}`,
        );
      }
      console.log(`Successfully created new assessment: ${data}`);
      return data.id;
    } catch (e) {
      throw new Error(`${e}`);
    }
  };

  // Delete assessment entry from database by id
  public static _deleteAssessmentEntry = async (id: string): Promise<void> => {
    const toBeDeletedAssessment = { id };

    try {
      // Delete database entry
      const deleteResult = await this.client.models.InProgressAssessment.delete(
        toBeDeletedAssessment,
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
  private static _fetchAssessmentStorageJson = async (
    path: string,
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
  private static _fetchAssessmentStoragePath = async (
    id: string,
  ): Promise<string> => {
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

  // Generate URL safe hash to use for assessment ids (negligable collision chances)
  private static _generateUrlSafeHash = (): string => {
    // Characters to use in hash
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
class CompletedAssessment extends Assessment {
  // ** PUBLIC METHODS TO BE USED IN OTHER FILES ** //

  // Complete an assessment, transition in progress assessment to a completed one
  public static completeInProgressAssessment = async (
    file: File,
    assessmentId: string,
  ): Promise<void> => {
    // Fetch session to use session id in storage path
    const session = await fetchAuthSession();
    if (!session.identityId) {
      throw new Error(`No session identity found!`);
    }

    // Get in progress assessment to complete data
    const assessmentToComplete =
      await InProgressAssessment.fetchAssessmentData(assessmentId);
    const { name, startedAt } = assessmentToComplete;

    // Get current time for completedAt
    const completedAt = new Date().toISOString();

    // Calculate duration in minutes
    let duration = -1;
    if (startedAt) {
      const startTime = new Date(startedAt).getTime();
      const endTime = new Date(completedAt).getTime();
      duration = Math.max(0, Math.floor((endTime - startTime) / (1000 * 60)));
    }

    // CALL SCORE CALCULATION METHOD HERE (NOT YET IMPLEMENTED) -- WILL USE TEMPORARY VARIABLES FOR NOW
    const complianceScore: number = 0;
    const isCompliant: boolean = false;

    // Upload new Completed assessment to storage
    const completedAssessmentStoragePath =
      await this._uploadAssessmentToStorage(
        file,
        `assessments/${session.identityId}/completed/${file.name}`,
      );

    // Create new completedAssessment database entry
    await this._createAssessmentEntry(
      assessmentId,
      name,
      completedAssessmentStoragePath,
      complianceScore,
      isCompliant,
      duration,
      completedAt,
    ).catch((err) => {
      throw new Error(`Error creating completed assessment entry : ${err}`);
    });

    // Delete old in progress assessment database entry and storage
    await InProgressAssessment.deleteAssessment(assessmentId).catch((err) => {
      throw new Error(`Error deleting old in progress assessment : ${err}`);
    });
  };

  // Delete assessment by id -> delete database entry and storage data
  public static deleteAssessment = async (id: string): Promise<void> => {
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
  public static fetchAssessmentData = async (
    id: string,
  ): Promise<{
    id: string;
    name: string;
    completedAt: string;
    complianceScore: number;
    isCompliant: boolean;
    storagePath: string;
    version: string;
    owner: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    duration: number;
  }> => {
    try {
      // Fetch data
      const { data, errors } = await this.client.models.CompletedAssessment.get(
        { id },
      );

      // If errors or data fromf fetching, throw errors
      if (errors) {
        throw new Error(`Error fetching completed assessments: ${errors}`);
      }
      if (!data) {
        throw new Error("No data found from query!");
      }
      return data;
    } catch (err) {
      throw new Error(`Error fetching completed assessments: ${err}`);
    }
  };

  // Fetch JSON assessment data from storage
  public static fetchAssessmentStorageData = async <T = unknown>(
    id: string,
  ): Promise<T> => {
    // Fetch assessment storage path fromd database using id
    const storagePath = await this._fetchAssessmentStoragePath(id).catch(
      (err) => {
        throw new Error(`Error getting storage path from database: ${err}`);
      },
    );

    // Use storage path from above to call storage download
    const assessmentJson = await this._fetchAssessmentStorageJson(
      storagePath,
    ).catch((err) => {
      throw new Error(`Error getting assessment storage: ${err}`);
    });

    // Return assessment data
    return assessmentJson as T;
  };

  // Fetch all completed assessments
  public static fetchAllCompletedAssessments = async (): Promise<
    {
      id: string;
      name: string;
      completedAt: string;
      complianceScore: number;
      isCompliant: boolean;
      storagePath: string;
      version: string;
      owner: string | null;
      readonly createdAt: string;
      readonly updatedAt: string;
      duration: number;
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

  // ** PRIVATE METHODS TO BE USED IN PUBLIC FUNCTIONS ** //

  // Create assessment database entry
  private static _createAssessmentEntry = async (
    id: string,
    name: string,
    path: string,
    complianceScore: number,
    isCompliant: boolean,
    duration: number = -1,
    completedAtTime?: string,
  ): Promise<void> => {
    try {
      // Get completed at date
      const getCurrentDateTime = (): string => {
        return completedAtTime || new Date().toISOString();
      };

      // New assessment entry object
      const { errors, data } =
        await this.client.models.CompletedAssessment.create({
          id,
          name,
          completedAt: getCurrentDateTime(),
          complianceScore,
          isCompliant,
          storagePath: path,
          version: "1",
          duration,
        });
      // If errors, handle
      if (errors) {
        throw new Error(`Error creating new assessment: ${errors[0].message}`);
      }
      console.log(`Successfully created new assessment: ${data}`);
    } catch (e) {
      throw new Error(`${e}`);
    }
  };

  // Delete assessment entry from database by id
  private static _deleteAssessmentEntry = async (id: string): Promise<void> => {
    const toBeDeletedAssessment = { id };

    try {
      // Delete database entry
      const deleteResult = await this.client.models.CompletedAssessment.delete(
        toBeDeletedAssessment,
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
  private static _fetchAssessmentStorageJson = async (
    path: string,
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
  private static _fetchAssessmentStoragePath = async (
    id: string,
  ): Promise<string> => {
    try {
      const { data, errors } =
        // Get assessment database entry
        await this.client.models.CompletedAssessment.get({ id });
      // If errors or no data, throw error
      if (errors) {
        throw new Error(`Error fetching completed assessments: ${errors}`);
      }
      if (!data) {
        throw new Error("No data found from query!");
      }
      // Return storage path
      return data.storagePath;
    } catch (err) {
      throw new Error(`Error fetching completed assessments: ${err}`);
    }
  };
}

export { InProgressAssessment, CompletedAssessment };
