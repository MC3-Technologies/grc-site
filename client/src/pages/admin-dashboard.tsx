import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { useEffect, useState } from "react";

import "../index.css";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";
import AdminProtected from "../components/admin/AdminProtected";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHome from "../components/admin/AdminHome";
import AdminUsers from "../components/admin/AdminUsers";
import AdminAssessments from "../components/admin/AdminAssessments";
import AdminQuestionnaire from "../components/admin/AdminQuestionnaire";
import AdminReports from "../components/admin/AdminReports";

export function AdminDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>("home");

  useEffect(() => {
    initFlowbite();
    
    // Get section from URL if present
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get("section");
    if (sectionParam && ["home", "users", "assessments", "questionnaire", "reports"].includes(sectionParam)) {
      setActiveSection(sectionParam);
    }
    
    setLoading(false);
  }, []);

  // Render the active section content
  const renderSection = () => {
    switch (activeSection) {
      case "users":
        return <AdminUsers />;
      case "assessments":
        return <AdminAssessments />;
      case "questionnaire":
        return <AdminQuestionnaire />;
      case "reports":
        return <AdminReports />;
      case "home":
      default:
        return <AdminHome />;
    }
  };

  return (
    <>
      <Navbar />
      <AdminProtected>
        <section className="mt-20 bg-white dark:bg-gray-900 min-h-screen">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              <AdminSidebar 
                activeSection={activeSection} 
                setActiveSection={setActiveSection} 
              />
              <div className="flex-1 p-4 md:p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Admin Dashboard
                    {activeSection !== "home" && (
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        / {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                      </span>
                    )}
                  </h1>
                </div>
                {renderSection()}
              </div>
            </div>
          )}
        </section>
      </AdminProtected>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminDashboard />
  </StrictMode>
);