import { defaultQuestions } from "../assessmentDefaultQuestions";
import {
  TextQuestion,
  RadioQuestion,
  SoftwareInventoryEntry,
  HardwareInventoryEntry,
} from "./questions";

class Assessment {
  private questions: (TextQuestion | RadioQuestion)[];
  private softwareInventory: SoftwareInventoryEntry[];
  private hardwareInventory: HardwareInventoryEntry[];

  constructor(
    questions: (TextQuestion | RadioQuestion)[],
    softwareInventory: SoftwareInventoryEntry[],
    hardwareInventory: HardwareInventoryEntry[]
  ) {
    this.questions = questions;
    this.softwareInventory = softwareInventory;
    this.hardwareInventory = hardwareInventory;
  }

  public addSoftwareEntry(entry: SoftwareInventoryEntry): void {
    const exists = this.softwareInventory.some(
      (existingEntry) => existingEntry.id === entry.id
    );
    if (exists) {
      throw new Error(`Software entry with ID '${entry.id}' already exists.`);
    }
    this.softwareInventory.push(entry);
  }

  public removeSoftwareEntry(id: string): void {
    const initialLength = this.softwareInventory.length;
    const updatedInventory = this.softwareInventory.filter(
      (entry) => entry.id !== id
    );
    if (updatedInventory.length === initialLength) {
      throw new Error(`Software entry with ID '${id}' not found.`);
    }
    this.softwareInventory = updatedInventory;
  }

  public addHardwareEntry(entry: HardwareInventoryEntry): void {
    const exists = this.hardwareInventory.some(
      (existingEntry) => existingEntry.id === entry.id
    );
    if (exists) {
      throw new Error(`Hardware entry with ID '${entry.id}' already exists.`);
    }
    this.hardwareInventory.push(entry);
  }

  public removeHardwareEntry(id: string): void {
    const initialLength = this.hardwareInventory.length;

    const updatedInventory = (this.hardwareInventory =
      this.hardwareInventory.filter((entry) => entry.id !== id));
    if (updatedInventory.length === initialLength) {
      throw new Error(`Hardware entry with ID '${id}' not found.`);
    }
    this.hardwareInventory = updatedInventory;
  }

  public updateValue = (id: string, val: string): void => {
    const question = this.questions.find((q) => q.id === id);
    if (!question) {
      throw new Error("Updating non-existent question.");
    }
    question.value = val;
  };

  private getNextQuestion = (
    id: string
  ): TextQuestion | RadioQuestion | undefined => {
    const nextQuestion = this.questions.find((q) => q.id === id);
    return nextQuestion;
  };

  public getQuestions = (): (TextQuestion | RadioQuestion)[] => {
    // Set question array to return
    const ret: (TextQuestion | RadioQuestion)[] = [];

    // Return ret if instance questions length is 0
    if (!this.questions.length) {
      return ret;
    }

    // Set visited set to make sure no infinite loop in next references
    const visited = new Set<string>();
    // Set temporary question node to start at
    let curr = this.questions[0];

    // Loop through question nodes next references and push to return array
    while (curr) {
      // If visited has current node id, throw loop detected error
      if (visited.has(curr.id)) {
        throw new Error("Loop detected in questions flow");
      }

      // Push current question node to curr
      ret.push(curr);
      // Add current node to visited set
      visited.add(curr.id);

      // Set next question to be found
      let nextQuestion: TextQuestion | RadioQuestion | undefined;

      // Loop through current node conditionals and set nextQuestion to next node if conditional met
      for (const conditional of curr.conditionals) {
        if (curr.value === conditional.value) {
          nextQuestion = this.getNextQuestion(conditional.next);
          if (!nextQuestion) {
            throw new Error(
              `Condition met, but next question ${conditional.next} does not exist`
            );
          }
          break;
        }
      }

      // If next question did not get defined by conditionals and current node still has next, find next question by id and set nextQuestion
      if (!nextQuestion && curr.next) {
        nextQuestion = this.getNextQuestion(curr.next);
        if (!nextQuestion) {
          throw new Error(`Next question ${curr.next} does not exist`);
        }
      }

      // If next question still not defined by above then break -- end of next references
      if (!nextQuestion) {
        break;
      }
      // Otherwise set current question node as next
      curr = nextQuestion;
    }
    return ret;
  };

  public getSoftwareInventory = (): SoftwareInventoryEntry[] => {
    return this.softwareInventory;
  };

  public getHardwareIventory = (): HardwareInventoryEntry[] => {
    return this.hardwareInventory;
  };
}

const getNewAssessment = (): Assessment => {
  return new Assessment(defaultQuestions, [], []);
};

const getExistingAssessment = (
  questions: (TextQuestion | RadioQuestion)[],
  hardwareInventory: HardwareInventoryEntry[],
  softwareInventory: SoftwareInventoryEntry[]
): Assessment => {
  return new Assessment(questions, softwareInventory, hardwareInventory);
};

const createNewAssessmentQuestions = (
  questions: (TextQuestion | RadioQuestion)[]
): Assessment => {
  return new Assessment(questions, [], []);
};

export {
  getNewAssessment,
  getExistingAssessment,
  createNewAssessmentQuestions,
};
export type { Assessment };
