import { uploadData } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import { surveyJson } from "../assessmentQuestions";
import { Model } from "survey-core";
import { getClientSchema } from "../amplify/schema";
import { remove } from "aws-amplify/storage";

class InProgressAssessment {
  private client: ReturnType<typeof getClientSchema>;

  constructor() {
    this.client = getClientSchema();
  }

  public deleteInProgressAssessment = async (id: string): Promise<void> => {
    // Temp copy of assessment storage path before we delete the entry
    const path = await this.getInProgressAssessmentStoragePath(id);

    // Delete assessment entry from database
    await this.handleDeleteAssessmentDatabaseEntry(id).catch((err) => {
      throw new Error(`Error deleteing assessment from database: ${err}`);
    });

    // Delete assessment JSON from storage
    await this.handleAssessmentStorageDelete(path).catch((err) => {
      throw new Error(`Error deleteing assessment JSON from storage: ${err}`);
    });

    console.info("Successfully deleted assessment");
  };

  // Get assessment storage path by ID
  public getInProgressAssessmentStoragePath = async (
    id: string
  ): Promise<string> => {
    try {
      const { data, errors } =
        await this.client.models.InProgressAssessment.get({
          id,
        });
      if (errors) {
        throw new Error(`Error fetching in progress assessments : ${errors}`);
      }
      if (data === null) {
        throw new Error("No data found from query!");
      }
      return data.storagePath;
    } catch (err) {
      throw new Error(`Error fetching in progress assessments : ${err}`);
    }
  };

  // Get All in progress assessments
  public getAllInProgressAssessments = async (): Promise<
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
      const { data, errors } =
        await this.client.models.InProgressAssessment.list();
      if (errors) {
        throw new Error(`Error fetching in progress assessments : ${errors}`);
      }
      return data;
    } catch (err) {
      throw new Error(`Error fetching in progress assessments : ${err}`);
    }
  };

  // Create new assessment
  public createInProgressAssessment = async (name: string): Promise<void> => {
    // Create hash to use for id
    const idHash = this.createRandomUrlSafeHash();

    // Create new assessment instance and create in progress json to upload
    const jsonString = JSON.stringify(new Model(surveyJson).data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], `${idHash}.json`, {
      type: "application/json",
    });

    // Upload new assessment json and get back path
    const storageUploadPath = await this.handleAssessmentStorageUpload(
      file
    ).catch((err) => {
      throw new Error(`Error uploading new assessment to storage : ${err}`);
    });

    // Create new assessment database entry using storage upload path from above
    await this.handleCreateAssessmentDatabaseEntry(
      idHash,
      name,
      storageUploadPath
    ).catch((err) => {
      throw new Error(`Error creating new assessment entry : ${err}`);
    });
  };

  // Create assessment database entry
  private handleCreateAssessmentDatabaseEntry = async (
    hash: string,
    name: string,
    path: string
  ) => {
    try {
      // New assessment
      const newAssessment = {
        id: hash,
        name,
        percentCompleted: 0,
        storagePath: path,
        version: "1",
      };
      // Create new db entry
      const { errors, data } =
        await this.client.models.InProgressAssessment.create(newAssessment);
      if (errors) {
        throw new Error(`Error creating new assessment: ${errors}`);
      }
      console.log(`Successfully created new assessment : ${data}`);
    } catch (e) {
      throw new Error(`${e}`);
    }
  };

  // Helper function to delete assessment database entry
  private handleDeleteAssessmentDatabaseEntry = async (
    id: string
  ): Promise<void> => {
    const toBeDeletedInProgressAssessment = {
      id,
    };

    try {
      const deleteResult = await this.client.models.InProgressAssessment.delete(
        toBeDeletedInProgressAssessment
      );
      if (deleteResult.errors) {
        throw new Error(
          `Error fetching in progress assessments : ${deleteResult.errors}`
        );
      }
    } catch (err) {
      throw new Error(`Error fetching in progress assessments : ${err}`);
    }
  };

  // Helper function to handle uploading assessment JSON file blobs to storage
  private handleAssessmentStorageUpload = async (
    assessment: File
  ): Promise<string> => {
    if (!assessment) {
      throw new Error("No assessment found");
    }

    // Fetch authentication session to upload with session id
    const session = await fetchAuthSession();
    if (!session.identityId) {
      throw new Error(`No session identity found!`);
    }

    try {
      // Upload JSON assessment file
      const res = await uploadData({
        path: `assessments/${session.identityId}/in-progress/${assessment.name}`,
        data: assessment,
        options: {
          bucket: "assessmentStorage",
        },
      }).result;

      console.log("Assessment uploaded successfully", res);
      return res.path;
    } catch (e) {
      throw new Error(`Error uploading assessment: ${e}`);
    }
  };

  // Handle delete assessment json blob in storage
  private handleAssessmentStorageDelete = async (
    path: string
  ): Promise<void> => {
    try {
      await remove({
        path,
        options: {
          bucket: "assessmentStorage",
        },
      });
    } catch (error) {
      throw new Error(
        `Error deleting assessment JSON blob from storage : ${error}`
      );
    }
  };

  // Create random url-safe hash to use for assessment IDs
  private createRandomUrlSafeHash = (): string => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };
}

class CompletedAssessment {
  private client: ReturnType<typeof getClientSchema>;

  constructor() {
    this.client = getClientSchema();
  }

  // Get all completed assessments
  public getAllInCompletedAssessments = async (): Promise<
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
      const { data, errors } =
        await this.client.models.CompletedAssessment.list();
      if (errors) {
        throw new Error(`Error fetching in progress assessments : ${errors}`);
      }
      return data;
    } catch (err) {
      throw new Error(`Error fetching in progress assessments : ${err}`);
    }
  };
}

export { InProgressAssessment, CompletedAssessment };
