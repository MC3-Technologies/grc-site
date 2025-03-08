// import { StrictMode, useEffect, useState } from "react";
// import { createRoot } from "react-dom/client";
// import { initFlowbite } from "flowbite";

// import "../index.css";
// import "survey-core/defaultV2.min.css";

// import Navbar from "../components/Navbar";
// import Chat from "../components/Chat";
// import Footer from "../components/Footer";

// import { surveyJson } from "../assessmentDefaultQuestions";
// import { Model, Survey } from "survey-react-ui";
// import { BorderlessDark, BorderlessLight } from "survey-core/themes";

// import { list } from "aws-amplify/storage";
// import { fetchAuthSession } from "aws-amplify/auth";
// import { redirectToSignIn } from "../utils/routing";
// import Spinner from "../components/Spinner";
// import { isLoggedIn } from "../amplify/auth";

// type Assessment = {
//   path: string;
//   lastModified: Date | undefined;
// };

// type UserAssessments = {
//   inProgress: Assessment[];
//   completed: Assessment[];
// };

// export function Assessment() {
//   const [survey] = useState(new Model(surveyJson));
//   const [loading, setLoading] = useState<boolean>(true);
//   const [userAssessments, setUserAssessments] = useState<UserAssessments>();

//   useEffect(() => {
//     const initialize = async () => {
//       const session = await fetchAuthSession();

//       const loggedIn = await isLoggedIn();

//       if (!loggedIn) {
//         redirectToSignIn();
//         return;
//       }

//       const inProgressAssessments = await list({
//         path: `assessments/${session.identityId}/in-progress/`,
//         options: {
//           bucket: "assessmentStorage",
//         },
//       });

//       const completedAssessments = await list({
//         path: `assessments/${session.identityId}/completed/`,
//         options: {
//           bucket: "assessmentStorage",
//         },
//       });

//       inProgressAssessments.items.forEach((assessment) => {
//         setUserAssessments((prev) => {
//           const currentInProgress = prev?.inProgress || [];
//           const currentCompleted = prev?.completed || [];

//           const newAssessment: Assessment = {
//             path: assessment.path,
//             lastModified: assessment.lastModified,
//           };

//           return {
//             inProgress: [...currentInProgress, newAssessment],
//             completed: currentCompleted,
//           };
//         });
//       });

//       completedAssessments.items.forEach((assessment) => {
//         setUserAssessments((prev) => {
//           const currentInProgress = prev?.inProgress || [];
//           const currentCompleted = prev?.completed || [];

//           const newAssessment: Assessment = {
//             path: assessment.path,
//             lastModified: assessment.lastModified,
//           };

//           return {
//             inProgress: currentInProgress,
//             completed: [...currentCompleted, newAssessment],
//           };
//         });
//       });

//       console.log(inProgressAssessments);
//       console.log(completedAssessments);
//     };

//     initialize().then(() => {
//       setLoading(false);
//     });
//   }, []);

//   useEffect(() => {
//     initFlowbite();

//     const storedDarkMode = localStorage.getItem("darkMode") === "true";
//     if (storedDarkMode) {
//       survey.applyTheme(BorderlessDark);
//     } else {
//       survey.applyTheme(BorderlessLight);
//     }

//     const handleDarkMode = () => survey.applyTheme(BorderlessDark);
//     const handleLightMode = () => survey.applyTheme(BorderlessLight);

//     window.addEventListener("darkMode", handleDarkMode);
//     window.addEventListener("lightMode", handleLightMode);

//     return () => {
//       window.removeEventListener("darkMode", handleDarkMode);
//       window.removeEventListener("lightMode", handleLightMode);
//     };
//   }, [survey]);

//   return (
//     <>
//       <Navbar />
//       <section className="mt-20 bg-white dark:bg-gray-900">
//         {loading ? (
//           <div className="my-10 justify-center flex">
//             <Spinner />
//           </div>
//         ) : (
//           <>
//             <p> In progress assessments</p>
//             {userAssessments?.inProgress.map((assessment, key) => {
//               <div key={key}>
//                 {`${assessment.path} -- ${assessment.lastModified}`}
//               </div>;
//             })}

//             <p> Completed assessments </p>
//             {userAssessments?.completed.map((assessment, key) => {
//               <div key={key}>
//                 {`${assessment.path} -- ${assessment.lastModified}`}
//               </div>;
//             })}
//             <Survey model={survey} />
//           </>
//         )}
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

import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";

import "../index.css";
import "survey-core/defaultV2.min.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";

import { uploadData } from "aws-amplify/storage";
import { getCurrentUser, User } from "../amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth";

export function Assessment() {
  const [file, setFile] = useState<File>();
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    initFlowbite();

    const someJson = {
      pages: [
        {
          name: "page-1",
          title: "Page 1 title",
          content: "Page 1 content",
        },
        {
          name: "page-2",
          title: "Page 2 title",
          content: "Page 2 content",
        },
        {
          name: "page-3",
          title: "Page 3 title",
          content: "Page 3 content",
        },
      ],
    };

    const blob = new Blob([JSON.stringify(someJson)], {
      type: "application/json",
    });
    const file = new File([blob], "data.json", { type: "application/json" });
    setFile(file);

    const getUser = async()=>{
      const u = await getCurrentUser()
      setUser(u)
    }

    getUser()

  }, []);

  const handleClick = async () => {
    if (!file) {
      console.log("No file found");
      return;
    }
    const session = await fetchAuthSession();
    try {
      const res = await uploadData({
        path: `assessments/${user?.userId}/in-progress/${file.name}`,
        data: file,
        options: {
          bucket: "assessmentStorage",
        },
      }).result;

      console.log("Succeeded: ", res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900">
        <button className="bg-blue"
          onClick={() => {
            handleClick();
          }}
        >
          Click me
        </button>
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
