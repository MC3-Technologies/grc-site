import { defaultQuestions } from "../assessmentDefaultQuestions";
import { TextQuestion, RadioQuestion, QuestionNode } from "./questions";

class Assessment {
  private head: QuestionNode | null = null;
  constructor(questions: (TextQuestion | RadioQuestion)[]) {
    let newHead = new QuestionNode(questions[0]);
    const setNewHead = (currentNode: QuestionNode) => {
      if (!currentNode) return;
      // console.log("Looking at node", currentNode.question);
      for (let conditional of currentNode.conditionals) {
        if (currentNode.value === conditional.value) {
          const nextObj = questions.find((q) => q.id === conditional.next);
          if (nextObj) {
            currentNode.next = new QuestionNode(nextObj);
            return setNewHead(currentNode.next);
          }
        }
      }
      const nextObj = questions.find((q) => q.id === currentNode.nextObjId);
      if (nextObj) {
        currentNode.next = new QuestionNode(nextObj);
        return setNewHead(currentNode.next);
      }
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
