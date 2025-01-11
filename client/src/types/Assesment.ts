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
    this.softwareInventory.push(entry);
  }

  public removeSoftwareEntry(id: string): void {
    this.softwareInventory = this.softwareInventory.filter(
      (entry) => entry.id !== id
    );
  }

  public addHardwareEntry(entry: HardwareInventoryEntry): void {
    this.hardwareInventory.push(entry);
  }

  public removeHardwareEntry(id: string): void {
    this.hardwareInventory = this.hardwareInventory.filter(
      (entry) => entry.id !== id
    );
  }

  public updateValue = (id: string, val: string): void => {
    const question = this.questions.find((q) => q.id === id);
    if (!question) {
      throw new Error("Updating non-existent question.");
    }
    question.value = val;
  };

  public getQuestions = (): (TextQuestion | RadioQuestion)[] => {
    const ret: (TextQuestion | RadioQuestion)[] = [];
    if (!this.questions.length) {
      return ret;
    }
    let temp = this.questions[0];
    const visited = new Set<string>();
    while (temp) {
      if (visited.has(temp.id)) {
        throw new Error("Loop detected in questions flow");
      }
      ret.push(temp);
      visited.add(temp.id);
      let nextQuestion: TextQuestion | RadioQuestion | undefined;
      for (const conditional of temp.conditionals) {
        if (temp.value === conditional.value) {
          nextQuestion = this.questions.find((q) => q.id === conditional.next);
          if (!nextQuestion) {
            throw new Error(
              `Condition met, but next question ${conditional.next} does not exist`
            );
          }
          break;
        }
      }
      if (!nextQuestion && temp.next) {
        nextQuestion = this.questions.find((q) => q.id === temp.next);
        if (!nextQuestion) {
          throw new Error(`Next question ${temp.next} does not exist`);
        }
      }
      if (!nextQuestion) {
        break;
      }
      temp = nextQuestion;
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

const getNewAssessment = () => {
  return new Assessment(defaultQuestions, [], []);
};

const getExistingAssessment = (
  questions: (TextQuestion | RadioQuestion)[],
  hardwareInventory: HardwareInventoryEntry[],
  softwareInventory: SoftwareInventoryEntry[]
) => {
  return new Assessment(questions, softwareInventory, hardwareInventory);
};

export { getNewAssessment, getExistingAssessment };
