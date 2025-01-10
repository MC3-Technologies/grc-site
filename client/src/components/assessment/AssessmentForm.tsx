import { useEffect, useState } from "react";
import { getNewAssessment } from "../../types/Assesment";
import { TextQuestion, RadioQuestion } from "../../types/questions";

const AssessmentForm = () => {
  const [assessment, setAssessment] = useState(getNewAssessment());
  const [questions, setQuestions] = useState<(TextQuestion | RadioQuestion)[]>(
    []
  );

  useEffect(() => {
    setQuestions(assessment.getQuestions());
  }, [assessment]);

  const handleInputChange = (id: string, value: string) => {
    assessment.updateValue(id, value);
    setQuestions(assessment.getQuestions());
  };

  return (
    <form>
      {questions.map((question) => (
        <div key={question.id} style={{ marginBottom: "20px" }}>
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
      ))}

      <button type="submit">Submit</button>
    </form>
  );
};

export default AssessmentForm;
