import { useEffect, useState } from "react";
import {
  CompletedAssessment,
  InProgressAssessment,
} from "../../utils/assessment";
import { getCurrentUser, User } from "../../amplify/auth";
import { fetchUsers, createTestUser } from "../../utils/adminUser";
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
  const [debugMessage, setDebugMessage] = useState<string>("");
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

        // Get user data from backend
        let userData = [];
        let pendingUsers = 0;
        try {
          userData = await fetchUsers() || [];
          pendingUsers = userData.filter(
            (user: { status: string }) => user.status === "pending"
          ).length;
        } catch (err) {
          console.warn("Could not fetch users, using placeholder data instead", err);
          // Fallback to placeholder data
          userData = [];
          pendingUsers = 0;
        }
        
        // Calculate compliance rate
        const compliantAssessments = completedAssessments.filter(
          (assessment) => assessment.isCompliant,
        );
        const complianceRate =
          completedAssessments.length > 0
            ? (compliantAssessments.length / completedAssessments.length) * 100
            : 0;

        // Set stats with real data or fallback values
        setStats({
          totalUsers: userData.length || 0,
          pendingUsers: pendingUsers,
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

  // Debugging functions
  const handleRefreshUsers = async () => {
    setDebugMessage("Refreshing users list...");
    try {
      const users = await fetchUsers();
      setDebugMessage(`Successfully fetched ${users.length} users.`);
      setStats(prev => ({
        ...prev,
        totalUsers: users.length || 0,
        pendingUsers: users.filter(user => user.status === "FORCE_CHANGE_PASSWORD" || user.status === "pending").length
      }));
    } catch (error) {
      setDebugMessage(`Error fetching users: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleCreateTestUser = async () => {
    setDebugMessage("Creating test user...");
    try {
      const result = await createTestUser();
      if (result.success) {
        setDebugMessage("Test user created successfully. Refreshing user list...");
        handleRefreshUsers();
      } else {
        setDebugMessage(`Failed to create test user: ${result.error}`);
      }
    } catch (error) {
      setDebugMessage(`Error creating test user: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const checkBackendStatus = async () => {
    setDebugMessage("Checking backend status...");
    try {
      // First check auth
      const { getCurrentUser, isCurrentUserAdmin } = await import("../../amplify/auth");
      try {
        const user = await getCurrentUser();
        setDebugMessage(`Authenticated as: ${user.email}`);
        
        // Check admin status
        const isAdmin = await isCurrentUserAdmin();
        setDebugMessage(prev => `${prev}\nAdmin status: ${isAdmin ? "✓ Admin" : "✗ Not admin"}`);
        
        // Now try to get users
        const users = await fetchUsers();
        setDebugMessage(prev => `${prev}\nFetched ${users.length} users (${users.length > 0 ? 'actual data' : 'mock data'})`);
        
        // Show the first user if any
        if (users.length > 0) {
          setDebugMessage(prev => `${prev}\nFirst user: ${users[0].email} (${users[0].status})`);
        }
      } catch (authError) {
        setDebugMessage(prev => `${prev}\nAuth error: ${authError instanceof Error ? authError.message : String(authError)}`);
      }
    } catch (error) {
      setDebugMessage(`Error checking backend: ${error instanceof Error ? error.message : String(error)}`);
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
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-md inline-block">
            Development Mode: Using mock data for UI testing
          </div>
        )}
      </div>

      {/* Debugging tools - only visible in development */}
      {process.env.NODE_ENV !== "production" && (
        <div className="p-4 mb-6 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Admin Debugging Tools
          </h3>
          <div className="flex gap-3 mb-3">
            <button
              onClick={handleRefreshUsers}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Users
            </button>
            <button
              onClick={handleCreateTestUser}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create Test User
            </button>
            <button
              onClick={checkBackendStatus}
              className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Check Backend Status
            </button>
          </div>
          {debugMessage && (
            <div className="p-3 bg-white border rounded dark:bg-gray-800 dark:border-gray-700">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{debugMessage}</pre>
            </div>
          )}
        </div>
      )}

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
