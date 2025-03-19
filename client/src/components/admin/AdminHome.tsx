import { useEffect, useState } from "react";
import {
  CompletedAssessment,
  InProgressAssessment,
} from "../../utils/assessment";
import { getCurrentUser, User } from "../../amplify/auth";
import Spinner from "../Spinner";

// Summary stats interface
interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  totalAssessments: {
    inProgress: number;
    completed: number;
  };
  complianceRate: number;
}

const AdminHome = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingUsers: 0,
    totalAssessments: {
      inProgress: 0,
      completed: 0,
    },
    complianceRate: 0,
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get current admin user
        const user = await getCurrentUser();
        setCurrentUser(user);

        // Fetch assessment data
        const inProgressAssessments =
          await InProgressAssessment.fetchAllAssessments();
        const completedAssessments =
          await CompletedAssessment.fetchAllCompletedAssessments();

        // Calculate compliance rate
        const compliantAssessments = completedAssessments.filter(
          (assessment) => assessment.isCompliant,
        );
        const complianceRate =
          completedAssessments.length > 0
            ? (compliantAssessments.length / completedAssessments.length) * 100
            : 0;

        // Set stats
        setStats({
          totalUsers: 10, // Placeholder - would come from user DB query
          pendingUsers: 2, // Placeholder - would come from user DB query
          totalAssessments: {
            inProgress: inProgressAssessments.length,
            completed: completedAssessments.length,
          },
          complianceRate,
        });
      } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome message */}
      <div className="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Welcome, {currentUser?.email}
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          You have {stats.pendingUsers} pending user approval
          {stats.pendingUsers !== 1 ? "s" : ""} and{" "}
          {stats.totalAssessments.inProgress} in-progress assessment
          {stats.totalAssessments.inProgress !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users card */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-primary-100 text-primary-600 rounded-full dark:bg-primary-900 dark:text-primary-300">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Users
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        {/* Pending users card */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-yellow-100 text-yellow-600 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Approvals
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.pendingUsers}
              </p>
            </div>
          </div>
        </div>

        {/* Assessments card */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900 dark:text-blue-300">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Assessments
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalAssessments.inProgress +
                  stats.totalAssessments.completed}
              </p>
            </div>
          </div>
        </div>

        {/* Compliance card */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-green-100 text-green-600 rounded-full dark:bg-green-900 dark:text-green-300">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Compliance Rate
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.complianceRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity section - placeholder */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Recent Activity
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This section will display recent user registrations, assessment
          completions, and other activity. This will be implemented in a future
          milestone.
        </p>
      </div>
    </div>
  );
};

export default AdminHome;
