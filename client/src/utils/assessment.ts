import { uploadData, downloadData } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import { Model } from "survey-core";
import { getClientSchema } from "../amplify/schema";
import { remove } from "aws-amplify/storage";
import { isCurrentUserAdmin } from "../amplify/auth";
import { v4 as uuidv4 } from "uuid";
import { cmmcLevel1Data } from "../data/questionnaire/cmmcLevel1/v1.1";

export type AssessmentStorageData = {
  data: string;
  questionnaire: string;
  questionnaireVersion: string;
};

// Assessment class with one global variable and one global in common method : upload assessment data to storage
class Assessment {
  // Client schema attribute
  protected static client = getClientSchema();

  // Check if current user is an admin
  protected static isAdmin = async (): Promise<boolean> => {
    try {
      // Use the existing isCurrentUserAdmin function from auth.ts
      return await isCurrentUserAdmin();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

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
        options: {
          bucket: "assessmentStorage",
        },
        //accessLevel: 'protected' // Specify access level here for identity-based rules
      }).result;
      //console.log("Assessment uploaded successfully", res);
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

  // Get assessment storage path from database entry
  protected static _fetchAssessmentStoragePath = async (
    id: string,
  ): Promise<string> => {
    try {
      const { data: inProgress, errors: inProgressErrors } =
        await this.client.models.InProgressAssessment.get({ id });

      if (inProgressErrors) {
        throw new Error(
          `Error fetching in-progress assessment: ${inProgressErrors}`,
        );
      }
      if (inProgress?.storagePath) {
        return inProgress.storagePath;
      }

      const { data: completed, errors: completedErrors } =
        await this.client.models.CompletedAssessment.get({ id });

      if (completedErrors?.length) {
        throw new Error(
          `Error fetching completed assessment: ${completedErrors}`,
        );
      }
      if (completed?.storagePath) {
        return completed.storagePath;
      }

      throw new Error(`Assessment ${id} not found in progress or completed`);
    } catch (err) {
      throw new Error(
        `Error fetching assessment storage path: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  // Return JSON assessment data from storage give storage path
  protected static _fetchAssessmentStorageJson = async (
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

  public static fetchAssessmentStorageData = async (
    id: string,
  ): Promise<AssessmentStorageData> => {
    const storagePath = await this._fetchAssessmentStoragePath(id).catch(
      (err) => {
        throw new Error(`Error getting storage path from database: ${err}`);
      },
    );

    const assessmentJson = await this._fetchAssessmentStorageJson(
      storagePath,
    ).catch((err) => {
      throw new Error(`Error getting assessment storage: ${err}`);
    });
    // console.log(assessmentJson)
    const ret = JSON.parse(assessmentJson as string) as AssessmentStorageData;

    return ret;
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
    try {
      //console.log(`Starting deletion process for assessment ID: ${id}`);

      // Get assessment data first to check ownership
      const assessmentData = await this.fetchAssessmentData(id);
      //console.log(
      //  "Found assessment data:",
      //  assessmentData.id,
      //  "Owner:",
      //  assessmentData.owner,
      //);

      // Get current session identity and user sub
      const session = await fetchAuthSession();
      const currentUserSub = session.userSub; // <-- Use User Pool Sub for owner comparison

      // Check if user is admin
      const isAdmin = await this.isAdmin();
      //console.log("User has admin privileges:", isAdmin);

      // Check ownership - only allow delete if user is admin or assessment owner
      if (!isAdmin && assessmentData.owner !== currentUserSub) {
        // <-- Compare owner with User Pool Sub
        throw new Error(
          "Permission denied: You can only delete your own assessments unless you are an admin",
        );
      }

      // First delete the database entry
      try {
        //console.log("Deleting database entry for assessment:", id);
        const toBeDeletedAssessment = { id };
        const deleteResult =
          await this.client.models.InProgressAssessment.delete(
            toBeDeletedAssessment,
          );

        if (deleteResult.errors) {
          // Format errors properly
          const errorMessages = deleteResult.errors
            .map((e) => e.message || JSON.stringify(e))
            .join(", ");
          throw new Error(`Database deletion errors: ${errorMessages}`);
        }

        //console.log("Successfully deleted assessment database entry");

        // Only after database entry is deleted, delete the storage
        try {
          //console.log(
          //  "Now deleting assessment from storage:",
          //  assessmentData.storagePath,
          //);
          await remove({
            path: assessmentData.storagePath,
            options: { bucket: "assessmentStorage" },
          });
          //console.log("Successfully deleted assessment storage file");
        } catch (storageError) {
          console.error("Storage deletion error:", storageError);
          // Even if storage deletion fails, we've already deleted the database entry
          // Log the error but don't throw, as the database record is gone
          console.warn(
            "Database entry was deleted but storage file may remain orphaned",
          );
        }
      } catch (dbError) {
        console.error("Database deletion error:", dbError);
        throw new Error(
          `Failed to delete assessment from database: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
        );
      }

      //console.log("Assessment deletion completed successfully");
    } catch (error) {
      console.error("Assessment deletion failed:", error);
      // Format the error message for better readability
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error deleting assessment: ${errorMessage}`);
    }
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

    // Create new assessment JSON to upload - STORE COMPLETE QUESTIONNAIRE DATA
    const assessmentData: AssessmentStorageData = {
      data: new Model(cmmcLevel1Data.surveyJson).data,
      questionnaire: JSON.stringify(cmmcLevel1Data.surveyJson),
      questionnaireVersion: cmmcLevel1Data.version,
    };

    const jsonString = JSON.stringify(assessmentData, null, 2);
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

    // Create new assessment database entry using storage upload path and version
    const newAssessmentId = await this._createAssessmentEntry(
      idHash,
      name,
      storageUploadPath,
      cmmcLevel1Data.version, // Pass the fetched version number
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
    // Assessment to be updated with proper schema format
    // Use a type expected by the API to avoid 'any' type
    type AssessmentUpdateParams = {
      id: string;
      currentPage: number;
      percentCompleted: number;
    };

    const updatedAssessment: AssessmentUpdateParams = {
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
    version: string, // Add version parameter
  ): Promise<string> => {
    // New assessment entry object
    try {
      const newAssessment = {
        id: hash,
        name,
        currentPage: 0,
        percentCompleted: 0,
        storagePath: path,
        version: version, // Use the passed version
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
      //console.log(`Successfully created new assessment: ${data}`);
      return data.id;
    } catch (e) {
      throw new Error(`${e}`);
    }
  };

  // Generate URL safe hash to use for assessment ids (negligable collision chances)
  private static _generateUrlSafeHash = (): string => {
    return uuidv4();
  };
}

// Completed assessment class
class CompletedAssessment extends Assessment {
  // ** PUBLIC METHODS TO BE USED IN OTHER FILES ** //

  // Complete an assessment, transition in progress assessment to a completed one
  public static completeInProgressAssessment = async (
    file: File,
    assessmentId: string,
    complianceScore: number,
  ): Promise<void> => {
    // Fetch session to use session id in storage path
    const session = await fetchAuthSession();
    if (!session.identityId) {
      throw new Error(`No session identity found!`);
    }

    // Get in progress assessment data, including its version
    const assessmentToComplete =
      await InProgressAssessment.fetchAssessmentData(assessmentId);
    const { name, startedAt, version } = assessmentToComplete; // Extract version

    // Get current time for completedAt
    const completedAt = new Date().toISOString();

    // Calculate duration in minutes
    let duration = -1;
    if (startedAt) {
      const startTime = new Date(startedAt).getTime();
      const endTime = new Date(completedAt).getTime();
      duration = Math.max(0, Math.floor((endTime - startTime) / (1000 * 60)));
    }

    // Upload new Completed assessment to storage
    const completedAssessmentStoragePath =
      await this._uploadAssessmentToStorage(
        file,
        `assessments/${session.identityId}/completed/${file.name}`,
      );

    // No is compliant calculation yet, so set to false
    const isCompliant = false;

    // Create new completedAssessment database entry
    await this._createAssessmentEntry(
      assessmentId,
      name,
      completedAssessmentStoragePath,
      complianceScore,
      isCompliant,
      version, // Pass the fetched version (Corrected Order)
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
    try {
      //console.log(
      //  `Starting deletion process for completed assessment ID: ${id}`,
      //);

      // Get assessment data first to check ownership
      const assessmentData = await this.fetchAssessmentData(id);
      //console.log(
      //  "Found completed assessment data:",
      //  assessmentData.id,
      //  "Owner:",
      //  assessmentData.owner,
      //);

      // Get current session identity and user sub
      const session = await fetchAuthSession();
      const currentUserSub = session.userSub; // <-- Use User Pool Sub for owner comparison

      // Check if user is admin
      const isAdmin = await this.isAdmin();
      //console.log("User has admin privileges:", isAdmin);

      // Check ownership - only allow delete if user is admin or assessment owner
      if (!isAdmin && assessmentData.owner !== currentUserSub) {
        // <-- Compare owner with User Pool Sub
        throw new Error(
          "Permission denied: You can only delete your own assessments unless you are an admin",
        );
      }

      // First delete the database entry
      try {
        //console.log("Deleting database entry for completed assessment:", id);
        const toBeDeletedAssessment = { id };
        const deleteResult =
          await this.client.models.CompletedAssessment.delete(
            toBeDeletedAssessment,
          );

        if (deleteResult.errors) {
          // Format errors properly
          const errorMessages = deleteResult.errors
            .map((e) => e.message || JSON.stringify(e))
            .join(", ");
          throw new Error(`Database deletion errors: ${errorMessages}`);
        }

        //console.log("Successfully deleted completed assessment database entry");

        // Only after database entry is deleted, delete the storage
        try {
          //console.log(
          //  "Now deleting completed assessment from storage:",
          //  assessmentData.storagePath,
          //);
          await remove({
            path: assessmentData.storagePath,
            options: { bucket: "assessmentStorage" },
          });
          //console.log("Successfully deleted completed assessment storage file");
        } catch (storageError) {
          console.error("Storage deletion error:", storageError);
          // Even if storage deletion fails, we've already deleted the database entry
          // Log the error but don't throw, as the database record is gone
          console.warn(
            "Database entry was deleted but storage file may remain orphaned",
          );
        }
      } catch (dbError) {
        console.error("Database deletion error:", dbError);
        throw new Error(
          `Failed to delete completed assessment from database: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
        );
      }

      //console.log("Completed assessment deletion completed successfully");
    } catch (error) {
      console.error("Completed assessment deletion failed:", error);
      // Format the error message for better readability
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error deleting completed assessment: ${errorMessage}`);
    }
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
    version: string, // Moved version parameter before optional ones
    duration: number = -1,
    completedAtTime?: string,
  ): Promise<void> => {
    try {
      // Get completed at date
      const getCurrentDateTime = (): string => {
        return completedAtTime || new Date().toISOString();
      };

      // New assessment entry object
      //const { errors, data } =
      const { errors } = await this.client.models.CompletedAssessment.create({
        id,
        name,
        completedAt: getCurrentDateTime(),
        complianceScore,
        isCompliant,
        storagePath: path,
        version: version, // Use the passed version
        duration,
      });
      // If errors, handle
      if (errors) {
        throw new Error(`Error creating new assessment: ${errors[0].message}`);
      }
      //console.log(`Successfully created new assessment: ${data}`);
    } catch (e) {
      throw new Error(`${e}`);
    }
  };
}

export { InProgressAssessment, CompletedAssessment };
