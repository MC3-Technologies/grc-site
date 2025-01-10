import { defaultQuestions } from "../assessmentDefaultQuestions";
import { TextQuestion, RadioQuestion, QuestionNode } from "./questions";

class Assessment {
  private head: QuestionNode | null = null;
  constructor(questions: (TextQuestion | RadioQuestion)[]) {
    const newHead = new QuestionNode(questions[0]);
    const setNewHead = (currentNode: QuestionNode) => {
      if (!currentNode) return;
      // console.log("Looking at node", currentNode.question);
      for (const conditional of currentNode.conditionals) {
        if (currentNode.value === conditional.value) {
          const nextObj = questions.find((q) => q.id === conditional.next);
          if (!nextObj) {
            throw new Error("Condition met, condition next does not exist");
          }
          currentNode.next = new QuestionNode(nextObj);
          return setNewHead(currentNode.next);
        }
      }
      if (currentNode.nextObjId === null) {
        return;
      }
      const nextObj = questions.find((q) => q.id === currentNode.nextObjId);
      if (!nextObj) {
        throw new Error("Next does not exist");
      }
      currentNode.next = new QuestionNode(nextObj);
      return setNewHead(currentNode.next);
    };
    setNewHead(newHead);
    this.head = newHead;
  }

  public getHead = (): QuestionNode | null => {
    return this.head;
  };

  public toString = (): string => {
    let result = "";
    let current = this.head;

    while (current !== null) {
      result += current.question + "\n";
      current = current.next;
    }

    return result.trim();
  };
}

const getNewAssessment = () => {
  return new Assessment(defaultQuestions);
};

const getExistingAssessment = (questions: (TextQuestion | RadioQuestion)[]) => {
  return new Assessment(questions);
};

export { getNewAssessment, getExistingAssessment };
