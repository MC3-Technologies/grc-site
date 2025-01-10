import { useEffect, useState } from "react";
import { getNewAssessment } from "../../types/Assesment";
import { TextQuestion, RadioQuestion } from "../../types/questions";

const AssessmentForm = () => {
  const [assessment] = useState(getNewAssessment());
  const [questions, setQuestions] = useState<(TextQuestion | RadioQuestion)[]>(
    []
  );

  const handleInputChange = (id: string, value: string) => {
    assessment.updateValue(id, value);
    setQuestions(assessment.getQuestions());
  };

  useEffect(() => {
    setQuestions(assessment.getQuestions());
  }, [assessment]);

  const getSections = (): JSX.Element[] => {
    const sectionQuestionSet = new Map<string, JSX.Element[]>();

    questions.forEach((question, key) => {
      if (!sectionQuestionSet.has(question.section)) {
        sectionQuestionSet.set(question.section, []);
      }

      const oldSectionArray = sectionQuestionSet.get(question.section) ?? [];
      oldSectionArray.push(
        <div key={key} style={{ marginBottom: "20px" }}>
          <label htmlFor={question.id}>{question.question}</label>

          {question.type === "text" ? (
            <input
              type="text"
              id={question.id}
              value={question.value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              style={{ display: "block", marginTop: "5px" }}
            />
          ) : question.type === "radio" ? (
            <div>
              {question.options.map((option) => (
                <label
                  key={option}
                  style={{ display: "block", marginTop: "5px" }}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={question.value === option}
                    onChange={() => handleInputChange(question.id, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      );

      sectionQuestionSet.set(question.section, oldSectionArray);
    });

    const ret: JSX.Element[] = [];

    for (const [section, questions] of sectionQuestionSet) {
      ret.push(
        <div key={section}>
          <h2>This is the {section} section.</h2>
          {questions.map((question, key) => (
            <div key={key}>{question}</div>
          ))}
        </div>
      );
    }

    return ret;
  };

  return <>{getSections()}</>;
};

export default AssessmentForm;
