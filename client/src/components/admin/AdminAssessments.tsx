import { useEffect, useState } from "react";
import {
  CompletedAssessment,
  InProgressAssessment,
} from "../../utils/assessment";
import Spinner from "../Spinner";

// Combined assessment type for the UI
interface AssessmentData {
  id: string;
  name: string;
  owner: string | null;
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
          (assessment) => ({
            id: assessment.id,
            name: assessment.name,
            owner: assessment.owner,
            status: "in-progress",
            progress: assessment.percentCompleted,
            createdAt: assessment.createdAt,
            updatedAt: assessment.updatedAt,
          }),
        );

        const completedData: AssessmentData[] = completedAssessments.map(
          (assessment) => ({
            id: assessment.id,
            name: assessment.name,
            owner: assessment.owner,
            status: "completed",
            progress: 100,
            score: assessment.complianceScore,
            isCompliant: assessment.isCompliant,
            createdAt: assessment.createdAt,
            updatedAt: assessment.updatedAt,
            completedAt: assessment.completedAt,
          }),
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
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
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
              <th scope="col" className="px-6 py-3">
                Owner
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Progress
              </th>
              <th scope="col" className="px-6 py-3">
                Created
              </th>
              <th scope="col" className="px-6 py-3">
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
                </th>
                <td className="px-6 py-4">{assessment.owner || "-"}</td>
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
                <td className="px-6 py-4">
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
                <td className="px-6 py-4">
                  {formatDate(assessment.createdAt)}
                </td>
                <td className="px-6 py-4">
                  {assessment.status === "completed"
                    ? formatDate(assessment.completedAt || "")
                    : formatDate(assessment.updatedAt)}
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                    View
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
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
