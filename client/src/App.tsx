import { useEffect } from "react";
import "./App.css";
import { Outlet } from "react-router-dom";

function App() {
  useEffect(() => {
    const setupQuestionnaire = async () => {
      try {
        //console.log("Questionnaire versioning initialized successfully");
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
