interface Conditional {
  value: string;
  next: string;
}

interface Question {
  id: string;
  question: string;
  value: string;
  conditionals: Conditional[];
  next: string | null;
}

interface TextQuestion extends Question {
  type: "text";
}

interface RadioQuestion extends Question {
  type: "radio";
  options: string[];
}

class QuestionNode {
  public id: string;
  public type: "radio" | "text" = "text";
  public question: string = "";
  private options: string[] | null = null;
  public value: string = "";
  public conditionals: Conditional[] = [];
  public nextObjId: string | null = "";
  public next: QuestionNode | null = null;

  constructor(question: TextQuestion | RadioQuestion) {
    this.id = question.id;
    if (question.type === "radio") {
      this.type = "radio";
      question.options.forEach((option) => {
        const newOptions = this.options;
        newOptions?.push(option);
        this.options = newOptions;
      });
    }
    this.question = question.question;
    this.value = question.value;
    this.conditionals = question.conditionals;
    this.nextObjId = question.next;
  }
}

export { QuestionNode };
export type { TextQuestion, RadioQuestion };
