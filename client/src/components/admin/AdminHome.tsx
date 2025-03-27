// File: client/src/components/admin/AdminHome.tsx
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
interface AdminStats {
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
  debugTimestamp?: string;
}

// Helper function to format dates in HST
const formatDateToHST = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      timeZone: "Pacific/Honolulu",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original string if conversion fails
  }
};

// Add window type extensions
declare global {
  // Window interface is now defined in types.d.ts
}

export default function AdminHome() {
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const lastRefreshTimeRef = useRef<Date>(new Date());
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forceRefreshCounter, setForceRefreshCounter] = useState<number>(0);
  // Add state for pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activitiesPerPage] = useState<number>(15); // Show 15 activities per page
  // Add user filter
  const [userFilter, setUserFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Function to fetch stats with improved error handling and debugging
  const fetchStats = useCallback(async (forceRefresh = true) => {
    try {
      // Clear any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      setIsLoading(true);

      // Clear cache before fetching when forcing refresh
      if (forceRefresh) {
        logDebug("Force refreshing admin stats and clearing cache");
        await clearAdminStatsCache();
      }

      logDebug("Fetching admin statistics");
      const stats = await fetchAdminStats(forceRefresh);
      logDebug("Admin stats received from API");

      if (stats) {
        logDebug(
          `Raw recent activity count: ${stats.recentActivity?.length || 0}`,
        );

        // Log ALL activities without filtering to debug what's actually coming from the API
        if (
          Array.isArray(stats.recentActivity) &&
          stats.recentActivity.length > 0
        ) {
          logDebug("ALL activities from API response:");
          stats.recentActivity.forEach((activity, idx) => {
            logDebug(
              `[${idx}] ${activity.action} - ${activity.timestamp} - ${activity.affectedResource}/${activity.resourceId || "no-id"} - ID: ${activity.id?.substring(0, 8) || "no-id"}`,
            );
          });
        } else {
          logDebug(
            "⚠️ No activities received from API - this could indicate a backend issue",
          );
        }

        // Ensure activity array is properly sorted by timestamp in descending order
        if (Array.isArray(stats.recentActivity)) {
          // Create a new array instead of trying to modify the original
          stats.recentActivity = [...stats.recentActivity]
            // Only filter out invalid activities (null/undefined)
            .filter((activity) => {
              if (!activity) return false;

              // Always log what we're processing
              logDebug(
                `Processing activity for display: ${activity.action} - ${activity.timestamp} - ${activity.affectedResource}/${activity.resourceId || activity.details?.email || "unknown"}`,
              );

              // Include all valid activities - USER_STATUS_UPDATED no longer exists
              return true;
            })
            .map((activity) => {
              // Ensure resourceId is set to email when available for consistency
              if (
                activity.affectedResource === "user" &&
                !activity.resourceId &&
                activity.details?.email
              ) {
                activity.resourceId = activity.details.email as string;
                logDebug(`Fixed missing resourceId for ${activity.action}`);
              }

              // Special handling for USER_DELETED events which may have different formats
              if (
                activity.action === "USER_DELETED" &&
                !activity.resourceId &&
                activity.details?.userId
              ) {
                // Try to use email from details if available
                activity.resourceId =
                  (activity.details.email as string) ||
                  (activity.details.userId as string);
                logDebug(
                  `Fixed USER_DELETED resourceId to: ${activity.resourceId}`,
                );
              }

              return activity;
            })
            .sort((a, b) => {
              // Sort by timestamp descending (newest first)
              const timeA = new Date(a.timestamp).getTime();
              const timeB = new Date(b.timestamp).getTime();
              return timeB - timeA;
            });

          logDebug(
            `After filtering and sorting: ${stats.recentActivity.length} activities`,
          );

          // Log the first 3 activities for debugging
          if (stats.recentActivity.length > 0) {
            stats.recentActivity.slice(0, 3).forEach((activity, index) => {
              logDebug(
                `Activity ${index}: ${activity.action} - ${activity.timestamp} - ${activity.affectedResource} - ${activity.resourceId}`,
              );
            });
          }
        }

        // After filtering and sorting, log the final set of activities
        if (stats.recentActivity && stats.recentActivity.length > 0) {
          logDebug(
            `After filtering and sorting: ${stats.recentActivity.length} activities`,
          );
          stats.recentActivity.slice(0, 5).forEach((activity, idx) => {
            logDebug(
              `Activity ${idx}: ${activity.action} - ${activity.timestamp} - ${activity.affectedResource} - ${activity.resourceId}`,
            );
          });
        } else {
          logDebug("⚠️ No activities found after filtering and sorting");

          // If we have no activities, schedule a retry with delay
          if (forceRefresh) {
            logDebug(
              "Scheduling retry in 5 seconds due to missing activities...",
            );
            setTimeout(() => {
              logDebug("Retrying stat fetch due to missing activities");
              clearAdminStatsCache();
              fetchAdminStats(true)
                .then((retryStats) => {
                  if (
                    retryStats &&
                    Array.isArray(retryStats.recentActivity) &&
                    retryStats.recentActivity.length > 0
                  ) {
                    logDebug(
                      `Retry successful, got ${retryStats.recentActivity.length} activities`,
                    );
                    setAdminStats(retryStats as unknown as AdminStats);
                  } else {
                    logDebug("⚠️ Retry failed to get activities");
                  }
                  setIsLoading(false);
                })
                .catch((err) => {
                  logDebug(`Error in retry fetch: ${err}`);
                  setIsLoading(false);
                });
            }, 5000);
            return; // Exit early, we'll update state in the retry
          }
        }

        // Add debugging timestamp to help identify when data was last processed
        const statsWithDebug = {
          ...stats,
          debugTimestamp: new Date().toISOString(),
        };

        setAdminStats(statsWithDebug as unknown as AdminStats);
        lastRefreshTimeRef.current = new Date();
        logDebug("Stats updated in component state");
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      logDebug(
        `Error fetching admin stats: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Improved event handling with a single debounced handler
  useEffect(() => {
    // Create a debounced handler function
    const timeout: NodeJS.Timeout | null = null;
    const debouncedRefresh = (eventType: string) => {
      console.log(`Debounced refresh triggered by: ${eventType}`);

      if (timeout) {
        clearTimeout(timeout);
      }

      // Schedule a silent refresh instead of showing notification
      setTimeout(() => {
        fetchStats(true);
      }, 1500);
    };

    // Handle admin actions with the debounced handler
    const handleAdminAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventType = customEvent.detail.type;

      logDebug(`Admin action detected: ${eventType}`);
      if (
        eventType === AdminEvents.USER_DELETED ||
        eventType === AdminEvents.USER_UPDATED ||
        eventType === AdminEvents.USER_APPROVED ||
        eventType === AdminEvents.USER_REJECTED ||
        eventType === AdminEvents.USER_SUSPENDED ||
        eventType === AdminEvents.USER_REACTIVATED ||
        eventType === AdminEvents.USER_ROLE_UPDATED ||
        eventType === AdminEvents.USER_CREATED
      ) {
        logDebug("Action requires refresh, initiating debounced refresh");
        debouncedRefresh(eventType);
      }
    };

    // Only add event listener to document, not window
    document.addEventListener("adminAction", handleAdminAction);

    // Add visibility change listener to check for updates when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastRefresh =
          new Date().getTime() - lastRefreshTimeRef.current.getTime();
        if (timeSinceLastRefresh > 30000) {
          // 30 seconds since last refresh
          logDebug(
            "Tab became visible after 30+ seconds, checking for updates...",
          );
          // Remove the data change detected code - instead just refresh silently
          fetchStats(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      document.removeEventListener("adminAction", handleAdminAction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchStats, forceRefreshCounter]);

  // Function to add debug info
  const logDebug = (message: string) => {
    console.log(`DEBUG: ${message}`);
  };

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

  // Function for manual refresh with improved sequence
  const handleManualRefresh = useCallback(() => {
    logDebug("Manual refresh requested");

    // Remove notification reset code

    // Set loading state
    setIsLoading(true);

    // Clear cache first
    clearAdminStatsCache();

    // Force a counter increment to trigger the useEffect
    setForceRefreshCounter((prev) => prev + 1);

    // Refresh the data
    fetchStats(true)
      .then(() => {
        setSuccess("Dashboard refreshed successfully");
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      })
      .catch((error) => {
        console.error("Error refreshing dashboard:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fetchStats]);

  useEffect(() => {
    // Initial fetch
    fetchStats(true);

    // Set up event listener for admin actions with improved handling
    const handleAdminAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventType = customEvent.detail.type;

      logDebug(`Admin action detected: ${eventType}`);
      if (
        eventType === AdminEvents.USER_DELETED ||
        eventType === AdminEvents.USER_UPDATED ||
        eventType === AdminEvents.USER_APPROVED ||
        eventType === AdminEvents.USER_REJECTED ||
        eventType === AdminEvents.USER_SUSPENDED ||
        eventType === AdminEvents.USER_REACTIVATED ||
        eventType === AdminEvents.USER_ROLE_UPDATED ||
        eventType === AdminEvents.USER_CREATED
      ) {
        logDebug("Action requires refresh, initiating refresh sequence");

        // Set loading state to indicate refresh is happening
        setIsLoading(true);

        // Clear cache immediately
        clearAdminStatsCache();

        // Increment force refresh counter to trigger refresh
        setForceRefreshCounter((prev) => prev + 1);

        // Wait longer to ensure backend has time to update database and audit logs
        setTimeout(async () => {
          logDebug("First refresh after admin action");
          // Force an initial refresh
          await fetchStats(true);

          // After a short delay, do a final refresh to catch any late updates
          setTimeout(async () => {
            logDebug("Final refresh to ensure all changes are captured");
            await fetchStats(true);
            setIsLoading(false);
          }, 2500);
        }, 3000); // Even longer initial delay for backend processing
      }
    };

    // Add event listeners to both document and window
    document.addEventListener("adminAction", handleAdminAction);
    window.addEventListener("adminAction", handleAdminAction);

    // Set up auto-refresh every 30 seconds (reduced from 1 minute)
    const refreshInterval = setInterval(() => {
      logDebug("Running scheduled refresh (30 second interval)");
      fetchStats(true); // Always force refresh
    }, 30 * 1000);

    // Add visibility change listener with improved handling
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastRefresh =
          new Date().getTime() - lastRefreshTimeRef.current.getTime();
        if (timeSinceLastRefresh > 5000) {
          // 5 seconds (reduced from 10)
          logDebug("Tab became visible, refreshing stats...");
          fetchStats(true); // Force refresh when tab becomes visible
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Store the current timeout ref value in a local variable for cleanup
    const currentTimeoutRef = refreshTimeoutRef.current;

    return () => {
      if (currentTimeoutRef) {
        clearTimeout(currentTimeoutRef);
      }
      clearInterval(refreshInterval);
      document.removeEventListener("adminAction", handleAdminAction);
      window.removeEventListener("adminAction", handleAdminAction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchStats, forceRefreshCounter]); // Added forceRefreshCounter as dependency

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  // Create a debounced version of your admin event handler
  window.createDebouncedHandler = () => {
    let timeout: NodeJS.Timeout | null = null;
    let isRefreshing = false;

    return (event: CustomEvent) => {
      console.log("✨ Debounced handler received event:", event.detail.type);

      // Clear any pending refreshes
      if (timeout) {
        console.log("🛑 Cancelling previous pending refresh");
        clearTimeout(timeout);
      }

      // If already refreshing, just schedule a final refresh
      if (isRefreshing) {
        console.log("⏳ Already refreshing, scheduling final refresh only");
        timeout = setTimeout(() => {
          console.log("🔄 Executing final debounced refresh");
          if (window.adminUser) {
            window.adminUser.clearAdminStatsCache();
          }
          // No need to set force counter or anything - this is direct
          timeout = null;
          isRefreshing = false;
        }, 2000);
        return;
      }

      // Start a new refresh sequence
      isRefreshing = true;
      console.log("🔄 Starting debounced refresh sequence");

      // Clear cache immediately
      if (window.adminUser) {
        window.adminUser.clearAdminStatsCache();
      }

      // Set a delayed refresh
      timeout = setTimeout(() => {
        console.log("🔄 Executing debounced refresh");
        // This would ideally call your fetchStats function directly
        // but we can use a workaround
        document.dispatchEvent(new CustomEvent("manualRefresh"));

        // Reset state
        timeout = null;
        isRefreshing = false;
      }, 1500);
    };
  };

  // Create and install the debounced handler
  const debouncedHandler = window.createDebouncedHandler();

  // Install it on window object for testing
  window.debouncedHandler = debouncedHandler;

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
        <div
          className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300 animate-fadeIn"
          role="alert"
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              ></path>
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
              onClick={() => {
                navigateTo("users", "tab=active");
                // Force the correct tab content to load
                window.localStorage.setItem("forceTabLoad", "active");
              }}
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
              onClick={() => {
                navigateTo("users", "tab=pending");
                // Force the correct tab content to load
                window.localStorage.setItem("forceTabLoad", "pending");
              }}
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
              onClick={() => {
                navigateTo("users", "tab=rejected");
                // Force the correct tab content to load
                window.localStorage.setItem("forceTabLoad", "rejected");
              }}
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
              onClick={() => {
                navigateTo("users", "tab=suspended");
                // Force the correct tab content to load
                window.localStorage.setItem("forceTabLoad", "suspended");
              }}
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
              <div className="flex items-center space-x-2">
                {/* Remove the New Data Available button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    ></path>
                  </svg>
                  Filters
                </button>
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
            </div>

            {/* Filter controls */}
            {showFilters && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <div className="flex-1">
                    <label
                      htmlFor="userFilter"
                      className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Filter by User Email
                    </label>
                    <input
                      type="text"
                      id="userFilter"
                      value={userFilter}
                      onChange={(e) => {
                        setUserFilter(e.target.value);
                        setCurrentPage(1); // Reset to first page when filter changes
                      }}
                      placeholder="Enter user email"
                      className="w-full p-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setUserFilter("");
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                    adminStats.recentActivity.length > 0 ? (
                      // Filter activities by user email if filter is set
                      adminStats.recentActivity
                        .filter((activity) => {
                          if (!userFilter) return true;

                          // Check different places where the email might be stored
                          const email =
                            activity.resourceId ||
                            (activity.details &&
                              (activity.details.email as string)) ||
                            "";

                          return email
                            .toLowerCase()
                            .includes(userFilter.toLowerCase());
                        })
                        // Apply pagination to display only a subset of activities
                        .slice(
                          (currentPage - 1) * activitiesPerPage,
                          currentPage * activitiesPerPage,
                        )
                        .map((activity, index) => {
                          // Skip invalid activities to prevent rendering errors
                          if (!activity || !activity.action) {
                            console.warn(
                              "Skipping invalid activity:",
                              activity,
                            );
                            return null;
                          }

                          try {
                            return (
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
                                  {activity.affectedResource || "Unknown"}
                                  {(activity.resourceId ||
                                    activity.details?.email) && (
                                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                                      {(activity.details?.email as string) ||
                                        activity.resourceId}
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-6">
                                  {formatActivityDetails(activity)}
                                </td>
                              </tr>
                            );
                          } catch (error) {
                            console.error(
                              "Error rendering activity:",
                              error,
                              activity,
                            );
                            return null;
                          }
                        })
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

              {/* Add pagination controls */}
              {adminStats?.recentActivity &&
                (() => {
                  // Get filtered activities
                  const filteredActivities = adminStats.recentActivity.filter(
                    (activity) => {
                      if (!userFilter) return true;

                      // Check different places where the email might be stored
                      const email =
                        activity.resourceId ||
                        (activity.details &&
                          (activity.details.email as string)) ||
                        "";

                      return email
                        .toLowerCase()
                        .includes(userFilter.toLowerCase());
                    },
                  );

                  // Only show pagination if we have more than one page
                  if (filteredActivities.length > activitiesPerPage) {
                    return (
                      <div className="flex justify-center mt-4">
                        <nav aria-label="Page navigation">
                          <ul className="inline-flex -space-x-px">
                            <li>
                              <button
                                onClick={() =>
                                  setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className={`px-3 py-2 ml-0 leading-tight ${
                                  currentPage === 1
                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-700 bg-white hover:bg-gray-100 hover:text-gray-700"
                                } rounded-l-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                              >
                                Previous
                              </button>
                            </li>

                            {/* Generate page numbers */}
                            {Array.from(
                              {
                                length: Math.min(
                                  5,
                                  Math.ceil(
                                    filteredActivities.length /
                                      activitiesPerPage,
                                  ),
                                ),
                              },
                              (_, i) => {
                                // Show at most 5 page numbers
                                const pageStart = Math.max(1, currentPage - 2);
                                const pageNum = pageStart + i;

                                if (
                                  pageNum <=
                                  Math.ceil(
                                    filteredActivities.length /
                                      activitiesPerPage,
                                  )
                                ) {
                                  return (
                                    <li key={pageNum}>
                                      <button
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-2 leading-tight ${
                                          currentPage === pageNum
                                            ? "text-blue-600 bg-blue-50 border-blue-300 hover:bg-blue-100 hover:text-blue-700"
                                            : "text-gray-700 bg-white hover:bg-gray-100 hover:text-gray-700"
                                        } border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                                      >
                                        {pageNum}
                                      </button>
                                    </li>
                                  );
                                }
                                return null;
                              },
                            )}

                            <li>
                              <button
                                onClick={() =>
                                  setCurrentPage(
                                    Math.min(
                                      Math.ceil(
                                        filteredActivities.length /
                                          activitiesPerPage,
                                      ),
                                      currentPage + 1,
                                    ),
                                  )
                                }
                                disabled={
                                  currentPage >=
                                  Math.ceil(
                                    filteredActivities.length /
                                      activitiesPerPage,
                                  )
                                }
                                className={`px-3 py-2 leading-tight ${
                                  currentPage >=
                                  Math.ceil(
                                    filteredActivities.length /
                                      activitiesPerPage,
                                  )
                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-700 bg-white hover:bg-gray-100 hover:text-gray-700"
                                } rounded-r-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                              >
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    );
                  }

                  return null;
                })()}
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
  // Create an explicit mapping for all action types
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
    // Keep this for backward compatibility with existing data
    USER_STATUS_UPDATED: "Status Updated",
  };

  // Return the mapped value or format the raw action string
  return actionMap[action] || action.replace(/_/g, " ");
};

// Function to determine the badge style based on action
const getActionBadgeStyle = (action: string): string => {
  // Positive actions - green
  if (
    action.includes("APPROVED") ||
    action.includes("REACTIVATED") ||
    action.includes("CREATED")
  ) {
    return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
  }
  // Negative actions - red
  else if (action.includes("REJECTED") || action.includes("DELETED")) {
    return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300";
  }
  // Warning actions - orange
  else if (action.includes("SUSPENDED")) {
    return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300";
  }
  // Update actions - purple
  else if (action === "USER_ROLE_UPDATED") {
    return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
  }
  // Default style - gray
  else {
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  }
};

// Function to format activity details
const formatActivityDetails = (activity: BackendAuditLog): JSX.Element => {
  // Safe guard against missing details
  if (!activity || !activity.details) return <span>No details available</span>;

  // Time-related properties to exclude from the details display
  const timeKeys = [
    "timestamp",
    "createdAt",
    "updatedAt",
    "completedAt",
    "deletedAt",
    "approvedAt",
    "rejectedAt",
    "suspendedAt",
    "reactivatedAt",
  ];

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

  // Safely get a timestamp display value
  const safeTimeDisplay = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Unknown time";
    }
  };

  // Get admin info string
  const getAdminInfo = (admin?: string): string => {
    return admin ? `by ${admin}` : "";
  };

  try {
    // Extract the most relevant details based on action type
    switch (activity.action) {
      case "USER_ROLE_UPDATED":
        return (
          <span>
            {activity.details.changeDirection === "promotion" ? (
              <span className="font-medium text-purple-600 dark:text-purple-400">
                Promoted to admin
              </span>
            ) : activity.details.changeDirection === "demotion" ? (
              <span className="font-medium text-purple-600 dark:text-purple-400">
                Changed to regular user
              </span>
            ) : (
              <span>
                Changed role to{" "}
                <strong className="text-purple-600 dark:text-purple-400">
                  {activity.details.newRole || "unknown role"}
                </strong>
              </span>
            )}
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getAdminInfo(activity.performedBy)}
            </span>
            {activity.details.previousRole && (
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                from <strong>{activity.details.previousRole}</strong>
              </span>
            )}
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              on{" "}
              {safeTimeDisplay(
                (activity.details.updatedAt as string) || activity.timestamp,
              )}
            </span>
          </span>
        );
      case "USER_DELETED":
        return (
          <span>
            <strong className="text-red-600 dark:text-red-400">Deleted</strong>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getAdminInfo(activity.performedBy)}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              on{" "}
              {safeTimeDisplay(
                (activity.details.deletedAt as string) || activity.timestamp,
              )}
            </span>
          </span>
        );
      case "USER_REACTIVATED":
        return (
          <span>
            <strong className="text-green-600 dark:text-green-400">
              Reactivated
            </strong>{" "}
            user account
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getAdminInfo(activity.performedBy)}
            </span>
            {activity.details.previousStatus && (
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                from status: <strong>{activity.details.previousStatus}</strong>
              </span>
            )}
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              on{" "}
              {safeTimeDisplay(
                (activity.details.reactivatedAt as string) ||
                  activity.timestamp,
              )}
            </span>
          </span>
        );
      case "USER_APPROVED":
        return (
          <span>
            <strong className="text-green-600 dark:text-green-400">
              Approved
            </strong>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getAdminInfo(activity.performedBy)}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              on{" "}
              {safeTimeDisplay(
                (activity.details.approvedAt as string) || activity.timestamp,
              )}
            </span>
          </span>
        );
      case "USER_REJECTED":
        return (
          <span>
            <strong className="text-red-600 dark:text-red-400">Rejected</strong>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getAdminInfo(activity.performedBy)}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              on{" "}
              {safeTimeDisplay(
                (activity.details.rejectedAt as string) || activity.timestamp,
              )}
            </span>
            {activity.details.reason && (
              <span className="block text-xs italic mt-1">
                Reason: "{activity.details.reason}"
              </span>
            )}
          </span>
        );
      case "USER_SUSPENDED": {
        // Function to truncate reason if too long
        const truncateReason = (reason: string, maxLength = 50) => {
          if (!reason) return "";
          if (reason.length <= maxLength) return reason;
          return `${reason.substring(0, maxLength)}...`;
        };

        // Get the reason from details
        const reason =
          (activity.details.reason as string) ||
          "Your account has been suspended by an administrator.";
        const isTruncated = reason.length > 50;

        return (
          <span>
            <strong className="text-orange-600 dark:text-orange-400">
              Suspended
            </strong>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getAdminInfo(activity.performedBy)}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              on{" "}
              {safeTimeDisplay(
                (activity.details.suspendedAt as string) || activity.timestamp,
              )}
            </span>
            <span className="block text-xs italic mt-1 relative group">
              Reason: "{isTruncated ? truncateReason(reason) : reason}"
              {/* Hover tooltip for truncated reason */}
              {isTruncated && (
                <span className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700">
                  {reason}
                </span>
              )}
            </span>
          </span>
        );
      }
      case "USER_CREATED":
        return (
          <span>
            Role:{" "}
            <strong className="text-green-600 dark:text-green-400">
              {activity.details.role || "user"}
            </strong>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getAdminInfo(activity.performedBy)}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              Created on{" "}
              {safeTimeDisplay(
                (activity.details.createdAt as string) || activity.timestamp,
              )}
            </span>
          </span>
        );
      default: {
        // For any other action types, try to extract and display the most relevant information
        const timeValue = getTimeValue(activity.details, activity.timestamp);

        return (
          <span>
            {Object.entries(activity.details)
              .filter(([key]) => !timeKeys.includes(key) && key !== "email")
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
              {getAdminInfo(activity.performedBy)}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              on {safeTimeDisplay(timeValue as string)}
            </span>
          </span>
        );
      }
    }
  } catch (error) {
    console.error("Error formatting activity details:", error, activity);
    return <span>Error displaying details</span>;
  }
};
