import { useEffect } from "react";
import { initializeVersioning } from "./utils/questionnaireUtils";
import "./App.css";
import { Outlet } from "react-router-dom";

function App() {
  // Initialize questionnaire versioning when app starts
  useEffect(() => {
    const setupQuestionnaire = async () => {
      try {
        await initializeVersioning();
        console.log("Questionnaire versioning initialized successfully");
      } catch (error) {
        console.error("Error initializing questionnaire versioning:", error);
      }
    };

    setupQuestionnaire();
  }, []);

  return (
    <div className="relative min-h-screen">
      <Outlet />
    </div>
  );
}

export default App;
