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

export type { TextQuestion, RadioQuestion };
