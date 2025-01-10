interface Conditional {
  value: string;
  next: string;
}

interface Question {
  id: string;
  next: string | null;
}

interface TextQuestion extends Question {
  type: "text";
  question: string;
  value: string;
  conditionals: Conditional[];
}

interface RadioQuestion extends Question {
  type: "radio";
  question: string;
  options: string[];
  value: string;
  conditionals: Conditional[];
}

class QuestionNode {
  public id: string;
  public type: "radio" | "text" = "text";
  public question: string = "";
  public value: string = "";
  public conditionals: Conditional[] = [];
  public nextObjId: string | null = "";
  public next: QuestionNode | null = null;
  private options: string[] | null = null;

  constructor(question: TextQuestion | RadioQuestion) {
    this.id = question.id;
    this.question = question.question;
    this.value = question.value;
    this.conditionals = question.conditionals;
    this.nextObjId = question.next;
    if (question.type === "radio") {
      this.type = "radio";
      question.options.forEach((option) => {
        const newOptions = this.options;
        newOptions?.push(option);
        this.options = newOptions;
      });
    }
  }
}

export { QuestionNode };
export type { TextQuestion, RadioQuestion };
