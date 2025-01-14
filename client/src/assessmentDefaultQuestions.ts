import { TextQuestion, RadioQuestion } from "./types/questions";

const defaultQuestions: (TextQuestion | RadioQuestion)[] = [
  {
    section: "example-section",
    id: "q1",
    type: "text",
    question: "What is your name?",
    value: "",
    next: "q2",
    conditionals: [],
  },
  {
    section: "example-section",
    id: "q2",
    type: "radio",
    question: "What is your preferred programming language?",
    options: ["JavaScript", "Python", "Go", "Rust"],
    value: "",
    next: "q3",
    conditionals: [
      { value: "JavaScript", next: "q2a" },
      { value: "Python", next: "q2b" },
    ],
  },
  {
    section: "example-section",
    id: "q2a",
    type: "text",
    question: "What JavaScript framework do you prefer?",
    value: "",
    next: "q3",
    conditionals: [],
  },
  {
    section: "example-section",
    id: "q2b",
    type: "text",
    question: "What Python framework do you prefer?",
    value: "",
    next: "q3",
    conditionals: [],
  },
  {
    section: "example-section2",
    id: "q3",
    type: "radio",
    question: "Do you prefer frontend or backend development?",
    options: ["Frontend", "Backend", "Fullstack"],
    value: "",
    next: "q4",
    conditionals: [],
  },
  {
    section: "example-section2",
    id: "q4",
    type: "text",
    question: "What is your biggest challenge in coding?",
    value: "",
    next: null,
    conditionals: [],
  },
];

export { defaultQuestions };
