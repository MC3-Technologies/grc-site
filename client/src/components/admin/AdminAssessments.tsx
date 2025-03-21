import { useEffect, useState } from "react";
import {
  CompletedAssessment,
  InProgressAssessment,
} from "../../utils/assessment";
import { fetchUsers } from "../../utils/adminUser";
import Spinner from "../Spinner";
import { redirectToInProgressAssessment, redirectToCompletedAssessment } from "../../utils/routing";

// Combined assessment type for the UI
interface AssessmentData {
  id: string;
  name: string;
  owner: string | null;
  ownerEmail?: string | null; // Added for displaying email instead of ID
  status: "in-progress" | "completed";
  progress: number;
  score?: number;
  isCompliant?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const AdminAssessments = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "in-progress" | "completed"
  >("all");
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // Fetch users and create a mapping of user IDs to emails
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await fetchUsers();
        const userMapping: Record<string, string> = {};
        
        users.forEach(user => {
          // The ID can be in user.attributes.sub or user.email (which is actually the UUID)
          const userId = user.attributes?.sub || user.email;
          // The actual email is in user.attributes.email
          const userEmail = user.attributes?.email;
          
          if (userId && userEmail) {
            userMapping[userId] = userEmail;
            console.log(`Mapped ID ${userId} to email ${userEmail}`);
          }
        });
        
        setUserMap(userMapping);
        console.log("User ID to Email mapping created:", userMapping);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    loadUsers();
  }, []);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        // Fetch both types of assessments
        const inProgressAssessments =
          await InProgressAssessment.fetchAllAssessments();
        const completedAssessments =
          await CompletedAssessment.fetchAllCompletedAssessments();

        // Convert to unified format for UI
        const inProgressData: AssessmentData[] = inProgressAssessments.map(
          (assessment) => {
            // Get owner email from userMap if available, otherwise check if owner is already an email
            const ownerEmail = assessment.owner ? 
              (userMap[assessment.owner] || 
                (assessment.owner.includes('@') ? assessment.owner : assessment.owner)) 
              : null;
              
            return {
              id: assessment.id,
              name: assessment.name,
              owner: assessment.owner,
              ownerEmail: ownerEmail,
              status: "in-progress",
              progress: assessment.percentCompleted,
              createdAt: assessment.createdAt,
              updatedAt: assessment.updatedAt,
            };
          }
        );

        const completedData: AssessmentData[] = completedAssessments.map(
          (assessment) => {
            // Get owner email from userMap if available, otherwise check if owner is already an email
            const ownerEmail = assessment.owner ? 
              (userMap[assessment.owner] || 
                (assessment.owner.includes('@') ? assessment.owner : assessment.owner)) 
              : null;
              
            return {
              id: assessment.id,
              name: assessment.name,
              owner: assessment.owner,
              ownerEmail: ownerEmail,
              status: "completed",
              progress: 100,
              score: assessment.complianceScore,
              isCompliant: assessment.isCompliant,
              createdAt: assessment.createdAt,
              updatedAt: assessment.updatedAt,
              completedAt: assessment.completedAt,
            };
          }
        );

        // Combine and sort by most recent first
        setAssessments(
          [...inProgressData, ...completedData].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
        );
      } catch (error) {
        console.error("Error fetching assessments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [userMap]);

  // Filter assessments based on active tab
  const filteredAssessments = assessments.filter((assessment) => {
    if (activeTab === "all") return true;
    return assessment.status === activeTab;
  });

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle view button click based on assessment status
  const handleViewAssessment = (assessment: AssessmentData) => {
    if (assessment.status === "in-progress") {
      redirectToInProgressAssessment(assessment.id);
    } else {
      redirectToCompletedAssessment(assessment.id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === "all"
                  ? "border-primary-600 text-primary-600 dark:text-primary-500 dark:border-primary-500"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              }`}
            >
              All Assessments
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("in-progress")}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === "in-progress"
                  ? "border-primary-600 text-primary-600 dark:text-primary-500 dark:border-primary-500"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              }`}
            >
              In Progress
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                {assessments.filter((a) => a.status === "in-progress").length}
              </span>
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("completed")}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === "completed"
                  ? "border-primary-600 text-primary-600 dark:text-primary-500 dark:border-primary-500"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              }`}
            >
              Completed
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                {assessments.filter((a) => a.status === "completed").length}
              </span>
            </button>
          </li>
        </ul>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3 hidden md:table-cell">
                Owner
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3 hidden md:table-cell">
                Progress
              </th>
              <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                Created
              </th>
              <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                {activeTab === "completed" ? "Completed" : "Last Updated"}
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAssessments.map((assessment) => (
              <tr
                key={assessment.id}
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {assessment.name}
                  {/* Mobile summary - only visible on small screens */}
                  <div className="md:hidden mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {assessment.ownerEmail && (
                      <div className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                        </svg>
                        {assessment.ownerEmail}
                      </div>
                    )}
                    <div className="flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                      </svg>
                      {assessment.status === "completed"
                        ? formatDate(assessment.completedAt || "")
                        : formatDate(assessment.updatedAt)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          assessment.status === "completed"
                            ? "bg-green-600"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${assessment.progress}%` }}
                      ></div>
                    </div>
                    <div>{assessment.progress}% complete</div>
                  </div>
                </th>
                <td className="px-6 py-4 hidden md:table-cell">
                  {assessment.ownerEmail || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      assessment.status === "in-progress"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    }`}
                  >
                    {assessment.status === "in-progress"
                      ? "In Progress"
                      : "Completed"}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className={`h-2.5 rounded-full ${
                        assessment.status === "completed"
                          ? "bg-green-600"
                          : "bg-blue-600"
                      }`}
                      style={{ width: `${assessment.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                    {assessment.progress}%
                  </span>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  {formatDate(assessment.createdAt)}
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  {assessment.status === "completed"
                    ? formatDate(assessment.completedAt || "")
                    : formatDate(assessment.updatedAt)}
                </td>
                <td className="px-6 py-4 space-x-2 flex flex-wrap gap-1">
                  <button 
                    onClick={() => handleViewAssessment(assessment)}
                    className="flex items-center px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                    aria-label="View assessment"
                    title="View assessment"
                  >
                    <svg 
                      className="w-3.5 h-3.5 mr-1" 
                      fill="currentColor" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                    </svg>
                    View
                  </button>
                  <button 
                    className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    aria-label="Export assessment"
                    title="Export assessment data"
                  >
                    <svg 
                      className="w-3.5 h-3.5 mr-1" 
                      fill="currentColor" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                    Export
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAssessments.length === 0 && (
        <div className="p-4 mt-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-300">
          No assessments found matching the selected filter.
        </div>
      )}

      <div className="mt-8 text-center p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          In future milestones, we'll implement:
        </p>
        <ul className="mt-2 text-sm text-left list-disc list-inside text-gray-500 dark:text-gray-400">
          <li>Assessment detail view</li>
          <li>Assessment export functionality</li>
          <li>Filtering by user</li>
          <li>Bulk actions</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminAssessments;
