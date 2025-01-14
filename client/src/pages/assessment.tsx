// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import { initFlowbite } from "flowbite";
// import { useEffect, useState } from "react";
// import { getNewAssessment } from "../types/Assesment";
// import { TextQuestion, RadioQuestion } from "../types/questions";

// import "../index.css";

// import Navbar from "../components/Navbar";
// import Chat from "../components/Chat";
// import Footer from "../components/Footer";

// export function Assessment() {
//   const [assessment] = useState(getNewAssessment());
//   const [questions, setQuestions] = useState<(TextQuestion | RadioQuestion)[]>(
//     []
//   );

//   useEffect(() => {
//     initFlowbite();
//   }, []);

//   useEffect(() => {
//     setQuestions(assessment.getQuestions());
//   }, [assessment]);

//   const handleInputChange = (id: string, value: string) => {
//     assessment.updateValue(id, value);
//     setQuestions(assessment.getQuestions());
//   };

//   const getSections = (): JSX.Element[] => {
//     const sectionQuestionSet = new Map<string, JSX.Element[]>();

//     questions.forEach((question, key) => {
//       if (!sectionQuestionSet.has(question.section)) {
//         sectionQuestionSet.set(question.section, []);
//       }

//       const oldSectionArray = sectionQuestionSet.get(question.section) ?? [];
//       oldSectionArray.push(
//         <div key={key} style={{ marginBottom: "20px" }}>
//           <label htmlFor={question.id}>{question.question}</label>

//           {question.type === "text" ? (
//             <input
//               type="text"
//               id={question.id}
//               value={question.value}
//               onChange={(e) => handleInputChange(question.id, e.target.value)}
//               style={{ display: "block", marginTop: "5px" }}
//             />
//           ) : question.type === "radio" ? (
//             <div>
//               {question.options.map((option) => (
//                 <label
//                   key={option}
//                   style={{ display: "block", marginTop: "5px" }}
//                 >
//                   <input
//                     type="radio"
//                     name={question.id}
//                     value={option}
//                     checked={question.value === option}
//                     onChange={() => handleInputChange(question.id, option)}
//                   />
//                   {option}
//                 </label>
//               ))}
//             </div>
//           ) : null}
//         </div>
//       );

//       sectionQuestionSet.set(question.section, oldSectionArray);
//     });

//     const ret: JSX.Element[] = [];

//     for (const [section, questions] of sectionQuestionSet) {
//       ret.push(
//         <div key={section}>
//           <h2>This is the {section} section.</h2>
//           {questions.map((question, key) => (
//             <div key={key}>{question}</div>
//           ))}
//         </div>
//       );
//     }

//     return ret;
//   };

//   return (
//     <>
//       <Navbar />
//       <section className="mt-20 bg-white dark:bg-gray-900">
//         {getSections()}
//       </section>
//       <Chat />
//       <Footer />
//     </>
//   );
// }

// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <Assessment />
//   </StrictMode>
// );

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { useEffect } from "react";

import "../index.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";

export function Assessment() {
  useEffect(() => {
    initFlowbite();
  }, []);

  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900">
        This is the assessment page.
      </section>
      <Chat />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Assessment />
  </StrictMode>
);
