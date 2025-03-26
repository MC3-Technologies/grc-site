import { useEffect, useState, useRef, useCallback } from "react";
import {
  fetchAdminStats,
  type AuditLog as BackendAuditLog,
  AdminEvents,
  clearAdminStatsCache,
} from "../../utils/adminUser";
import Spinner from "../Spinner";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/outline";
import { ClockIcon } from "@heroicons/react/24/outline";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { NoSymbolIcon } from "@heroicons/react/24/outline";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import StatCard from "./StatCard";

// Dashboard statistics interface
interface AdminStatistics {
  users: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
    suspended: number;
  };
  assessments: {
    total: number;
    inProgress: number;
    completed: number;
    compliant: number;
    nonCompliant: number;
  };
  complianceRate: number;
  recentActivity: BackendAuditLog[];
}

// Helper function to format dates in HST
const formatDateToHST = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'Pacific/Honolulu',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if conversion fails
  }
};

export default function AdminHome() {
  const [adminStats, setAdminStats] = useState<AdminStatistics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const lastRefreshTimeRef = useRef<Date>(new Date());
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Function to navigate to different sections
  const navigateTo = (section: string, params?: string) => {
    setActiveTab(section);
    if (params) {
      window.location.href = `/admin/?section=${section}&${params}`;
    } else {
      window.location.href = `/admin/?section=${section}`;
    }
  };

  const navigateToInProgress = () => {
    window.location.href = `/admin/?section=assessments&tab=in-progress`;
  };

  const navigateToCompleted = () => {
    window.location.href = `/admin/?section=assessments&tab=completed`;
  };

  // Function to fetch stats with debounce
  const fetchStats = useCallback(async (forceRefresh = true) => {
    try {
      // Clear any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      setIsLoading(true);
      
      // Clear cache before fetching when forcing refresh
      if (forceRefresh) {
        console.log("Force refreshing admin stats and clearing cache");
        clearAdminStatsCache();
      }
      
      console.log("Fetching admin stats...");
      const stats = await fetchAdminStats(forceRefresh);
      console.log("Admin stats received:", stats);
      
      if (stats) {
        console.log("Raw recent activity before filtering:", stats.recentActivity);
        
        // Filter out USER_STATUS_UPDATED entries before setting state
        if (Array.isArray(stats.recentActivity)) {
          stats.recentActivity = stats.recentActivity.filter(activity => 
            activity.action !== "USER_STATUS_UPDATED"
          );
          console.log("Filtered recent activity:", stats.recentActivity);
        }
        
        setAdminStats(stats as unknown as AdminStatistics);
        lastRefreshTimeRef.current = new Date();
        console.log("Stats updated in component state");
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function for manual refresh
  const handleManualRefresh = useCallback(() => {
    console.log("Manual refresh requested");
    
    // Set loading state
    setIsLoading(true);
    
    // Clear cache first
    clearAdminStatsCache();
    
    // Add a more significant delay to ensure backend operations complete
    setTimeout(async () => {
      try {
        console.log("First refresh attempt after manual refresh request");
        // Force a fresh reload of data
        const freshStats = await fetchAdminStats(true);
        setAdminStats(freshStats as unknown as AdminStatistics);
        lastRefreshTimeRef.current = new Date();
        
        // Set success message
        setSuccess("Dashboard refreshed successfully");
        
        // Make a second refresh after a short delay to catch any late-arriving changes
        setTimeout(async () => {
          console.log("Second refresh attempt to catch any remaining updates");
          const finalStats = await fetchAdminStats(true);
          setAdminStats(finalStats as unknown as AdminStatistics);
          lastRefreshTimeRef.current = new Date();
          
          // Auto-dismiss success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        }, 2000);
      } catch (error) {
        console.error("Error refreshing dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }, 2000); // Increased from 1200ms to 2000ms
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchStats(true);

    // Set up event listener for admin actions
    const handleAdminAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventType = customEvent.detail.type;
      
      console.log("Admin action detected:", eventType);
      if (eventType === AdminEvents.USER_DELETED ||
          eventType === AdminEvents.USER_UPDATED ||
          eventType === AdminEvents.USER_APPROVED ||
          eventType === AdminEvents.USER_REJECTED ||
          eventType === AdminEvents.USER_SUSPENDED ||
          eventType === AdminEvents.USER_REACTIVATED ||
          eventType === AdminEvents.USER_CREATED) {
        console.log("Action requires refresh, initiating refresh sequence");
        
        // Set loading state to indicate refresh is happening
        setIsLoading(true);
        
        // Clear cache immediately
        clearAdminStatsCache();
        
        // Wait longer to ensure backend has time to update database and audit logs
        setTimeout(async () => {
          console.log("First refresh after admin action");
          // Force an initial refresh
          await fetchStats(true);
          
          // After a short delay, do a final refresh to catch any late updates
          setTimeout(async () => {
            console.log("Final refresh to ensure all changes are captured");
            await fetchStats(true);
            setIsLoading(false);
          }, 2500);
        }, 3000); // Even longer initial delay for backend processing
      }
    };

    document.addEventListener('adminAction', handleAdminAction);

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      console.log("Running scheduled refresh (5 minute interval)");
      fetchStats(false); // Use cache for scheduled refreshes to reduce load
    }, 5 * 60 * 1000);

    // Add visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastRefresh = new Date().getTime() - lastRefreshTimeRef.current.getTime();
        if (timeSinceLastRefresh > 30000) { // 30 seconds
          console.log("Tab became visible, refreshing stats...");
          fetchStats(true); // Force refresh when tab becomes visible after 30+ seconds
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Store the current timeout ref value in a local variable for cleanup
    const currentTimeoutRef = refreshTimeoutRef.current;

    return () => {
      if (currentTimeoutRef) {
        clearTimeout(currentTimeoutRef);
      }
      clearInterval(refreshInterval);
      document.removeEventListener('adminAction', handleAdminAction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStats]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of users and assessments
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300 animate-fadeIn" role="alert">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span>{success}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <>
          {/* User Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {/* Total Users Card */}
            <StatCard
              title="Total Users"
              value={
                adminStats?.users?.total ||
                (Array.isArray(adminStats?.users)
                  ? adminStats?.users?.length
                  : 0)
              }
              icon={<UserGroupIcon className="h-8 w-8 text-primary-600" />}
              color="blue"
              onClick={() => navigateTo("users")}
              clickable={true}
            />

            {/* Active Users Card */}
            <StatCard
              title="Active Users"
              value={
                adminStats?.users?.active ||
                (Array.isArray(adminStats?.users)
                  ? adminStats?.users?.filter((u) => u.status === "ACTIVE")
                      ?.length
                  : 0)
              }
              icon={<UserIcon className="h-8 w-8 text-green-600" />}
              color="green"
              onClick={() => navigateTo("users", "tab=active")}
              clickable={true}
            />

            {/* Pending Users Card */}
            <StatCard
              title="Pending Approval"
              value={
                adminStats?.users?.pending ||
                (Array.isArray(adminStats?.users)
                  ? adminStats?.users?.filter((u) => u.status === "PENDING")
                      ?.length
                  : 0)
              }
              icon={<ClockIcon className="h-8 w-8 text-yellow-600" />}
              color="yellow"
              onClick={() => navigateTo("users", "tab=pending")}
              clickable={true}
            />

            {/* Rejected Users Card */}
            <StatCard
              title="Rejected Users"
              value={
                adminStats?.users?.rejected ||
                (Array.isArray(adminStats?.users)
                  ? adminStats?.users?.filter((u) => u.status === "REJECTED")
                      ?.length
                  : 0)
              }
              icon={<XCircleIcon className="h-8 w-8 text-red-600" />}
              color="red"
              onClick={() => navigateTo("users", "tab=rejected")}
              clickable={true}
            />

            {/* Suspended Users Card */}
            <StatCard
              title="Suspended Users"
              value={
                adminStats?.users?.suspended ||
                (Array.isArray(adminStats?.users)
                  ? adminStats?.users?.filter((u) => u.status === "SUSPENDED")
                      ?.length
                  : 0)
              }
              icon={<NoSymbolIcon className="h-8 w-8 text-orange-600" />}
              color="orange"
              onClick={() => navigateTo("users", "tab=suspended")}
              clickable={true}
            />
          </div>

          {/* Assessment Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Assessments Card */}
            <StatCard
              title="Total Assessments"
              value={adminStats?.assessments?.total || 0}
              icon={<DocumentTextIcon className="h-8 w-8 text-primary-600" />}
              color="blue"
              onClick={() => navigateTo("assessments")}
              clickable={true}
            />

            {/* In Progress Assessments Card */}
            <StatCard
              title="In Progress"
              value={adminStats?.assessments?.inProgress || 0}
              icon={<DocumentIcon className="h-8 w-8 text-yellow-600" />}
              color="yellow"
              onClick={navigateToInProgress}
              clickable={true}
            />

            {/* Completed Assessments Card */}
            <StatCard
              title="Completed"
              value={adminStats?.assessments?.completed || 0}
              icon={<CheckCircleIcon className="h-8 w-8 text-green-600" />}
              color="green"
              onClick={navigateToCompleted}
              clickable={true}
            />

            {/* Compliance Rate Card */}
            <StatCard
              title="Compliance Rate"
              value={`${adminStats?.complianceRate || 0}%`}
              icon={<ShieldCheckIcon className="h-8 w-8 text-blue-600" />}
              color="blue"
              onClick={() => navigateTo("assessments")}
              clickable={true}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Add user card */}
              <div
                className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${activeTab === "users" ? "active-card" : ""}`}
                onClick={() => navigateTo("users")}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Manage Users
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add, approve, or modify user accounts
                </p>
              </div>

              {/* View assessments card */}
              <div
                className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${activeTab === "assessments" ? "active-card" : ""}`}
                onClick={() => navigateTo("assessments")}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  View Assessments
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Browse and review user assessments
                </p>
              </div>

              {/* System settings card */}
              <div
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => navigateTo("settings")}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Settings
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure application settings
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Admin Activities
              </h2>
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
              >
                <svg
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                {isLoading ? "Refreshing..." : "Refresh Now"}
              </button>
            </div>
            
            <div className="overflow-x-auto relative">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Spinner />
                </div>
              ) : (
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="py-3 px-6">
                      Time
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Action
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Admin
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Resource
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adminStats?.recentActivity && 
                    adminStats.recentActivity
                      .filter(activity => activity.action !== "USER_STATUS_UPDATED")
                      .length > 0 ? (
                    adminStats.recentActivity
                      .filter(activity => activity.action !== "USER_STATUS_UPDATED")
                      .map((activity, index) => (
                    <tr
                      key={activity.id || `activity-${index}`}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                    >
                      <td className="py-4 px-6">
                        {formatDateToHST(activity.timestamp)}
                      </td>
                      <td className="py-4 px-6">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeStyle(activity.action)}`}
            >
              {formatActionName(activity.action)}
            </span>
                      </td>
                      <td className="py-4 px-6">
                        {activity.performedBy || "System"}
                      </td>
                      <td className="py-4 px-6">
                        {activity.affectedResource}
                        {activity.resourceId && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {(activity.details?.email as string) || activity.resourceId}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {formatActivityDetails(activity)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 px-6 text-center">
                      No recent activities found
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Add these helper functions at the end of the component, before the final return statement
// Function to format action names for display
const formatActionName = (action: string): string => {
  // Just check for USER_DELETED now
  if (action === "USER_DELETED") {
    return "User Deleted";
  }

  const actionMap: { [key: string]: string } = {
    USER_APPROVED: "User Approved",
    USER_REJECTED: "User Rejected",
    USER_SUSPENDED: "User Suspended", 
    USER_REACTIVATED: "User Reactivated",
    USER_CREATED: "User Created",
    USER_ROLE_UPDATED: "Role Updated",
    USER_DELETED: "User Deleted",
    ASSESSMENT_CREATED: "Assessment Created",
    ASSESSMENT_COMPLETED: "Assessment Completed",
    ASSESSMENT_DELETED: "Assessment Deleted",
  };

  return actionMap[action] || action.replace(/_/g, " ");
};

// Function to determine the badge style based on action
const getActionBadgeStyle = (action: string): string => {
  if (action.includes("APPROVED") || action.includes("REACTIVATED")) {
    return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
  } else if (action.includes("REJECTED") || action.includes("DELETED")) {
    return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300";
  } else if (action.includes("SUSPENDED")) {
    return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300";
  } else if (action.includes("CREATED")) {
    return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
  } else if (action === "USER_ROLE_UPDATED") { // Be more specific here
    return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
  } else {
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  }
};

// Function to format activity details
const formatActivityDetails = (activity: BackendAuditLog): JSX.Element => {
  if (!activity.details) return <></>;

  // Time-related properties to exclude from the details display
  const timeKeys = ["timestamp", "createdAt", "updatedAt", "completedAt"];

  // Find the first available time value to display
  const getTimeValue = (
    details: Record<string, unknown>,
    defaultTime: string,
  ): string => {
    const timeKey = timeKeys.find((key) => details[key]);
    return timeKey && details[timeKey]
      ? (details[timeKey] as string)
      : defaultTime;
  };

  // Extract the most relevant details based on action type
  switch (activity.action) {
    case "USER_ROLE_UPDATED":
      return (
        <span>
          Changed role to <strong>{activity.details.newRole}</strong>
          {activity.details.updatedAt && (
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              on{" "}
              {new Date(activity.details.updatedAt as string).toLocaleString()}
            </span>
          )}
        </span>
      );
    case "USER_APPROVED":
      return (
        <span>
          <strong>Approved</strong> on{" "}
          {activity.details.approvedAt
            ? new Date(activity.details.approvedAt as string).toLocaleString()
            : new Date(activity.timestamp).toLocaleString()}
        </span>
      );
    case "USER_REACTIVATED":
      return (
        <span>
          <strong>Reactivated</strong> on{" "}
          {activity.details.reactivatedAt
            ? new Date(
                activity.details.reactivatedAt as string,
              ).toLocaleString()
            : new Date(activity.timestamp).toLocaleString()}
        </span>
      );
    case "USER_REJECTED":
      return (
        <span>
          <strong>Rejected</strong>
          {activity.details.rejectedAt && (
            <span className="block text-xs">
              on{" "}
              {new Date(activity.details.rejectedAt as string).toLocaleString()}
            </span>
          )}
          {activity.details.reason && (
            <span className="block text-xs italic mt-1">
              Reason: "{activity.details.reason}"
            </span>
          )}
        </span>
      );
    case "USER_SUSPENDED":
      return (
        <span>
          <strong>Suspended</strong>
          {activity.details.suspendedAt && (
            <span className="block text-xs">
              on{" "}
              {new Date(
                activity.details.suspendedAt as string,
              ).toLocaleString()}
            </span>
          )}
          {activity.details.reason && (
            <span className="block text-xs italic mt-1">
              Reason: "{activity.details.reason}"
            </span>
          )}
        </span>
      );
    case "USER_CREATED":
      return (
        <span>
          Role: <strong>{activity.details.role || "user"}</strong>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            Created on{" "}
            {new Date(
              (activity.details.createdAt as string) || activity.timestamp,
            ).toLocaleString()}
          </span>
        </span>
      );
    case "USER_DELETED":
      return (
        <span>
          <strong>Deleted</strong> on{" "}
          {activity.details.deletedAt
            ? new Date(activity.details.deletedAt as string).toLocaleString()
            : new Date(activity.timestamp).toLocaleString()}
        </span>
      );
    default: {
      // For any other action types, try to extract and display the most relevant information
      const timeValue = getTimeValue(activity.details, activity.timestamp);

      return (
        <span>
          {Object.entries(activity.details)
            .filter(([key]) => !timeKeys.includes(key))
            .map(([key, value]) =>
              typeof value === "object" ? null : (
                <span key={key} className="block">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                  :<strong> {String(value)}</strong>
                </span>
              ),
            )}
          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(timeValue as string).toLocaleString()}
          </span>
        </span>
      );
    }
  }
};
