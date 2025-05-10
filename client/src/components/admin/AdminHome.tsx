// File: client/src/components/admin/AdminHome.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  fetchAdminStats,
  type AuditLog as BackendAuditLog,
  AdminEvents,
  clearAdminStatsCache,
  clearUserCache,
  getAllUserCounts,
  getAllAssessmentCounts,
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
      timeZone: "Pacific/Honolulu", // Explicitly use HST
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
  // Add filters state
  const [userFilter, setUserFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [adminEmailFilter, setAdminEmailFilter] = useState<string>(""); // State for admin email filter
  const [startDateFilter, setStartDateFilter] = useState<string>(""); // State for start date filter
  const [endDateFilter, setEndDateFilter] = useState<string>(""); // State for end date filter
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Define possible actions for the filter dropdown
  // Include USER_UPDATED for backward compatibility in the dropdown
  const possibleActions = [
    ...Object.values(AdminEvents),
    "USER_UPDATED", // Add USER_UPDATED for backward compatibility
  ].filter((action) => action !== "USER_STATUS_UPDATED");

  // Function to fetch stats with improved error handling and debugging
  const fetchStats = useCallback(async () => {
    try {
      // Clear any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      setIsLoading(true);

      // Always clear cache before fetching to ensure fresh data
      await clearAdminStatsCache();

      // Get accurate counts directly from DynamoDB
      await Promise.all([
        getAllUserCounts(),
        getAllAssessmentCounts()
      ]);
      
      //console.log("Dashboard direct user counts:", userCounts);
      //console.log("Dashboard direct assessment counts:", assessmentCounts);

      // Fetch the admin stats - includes direct counts internally
      const stats = await fetchAdminStats();
      
      if (stats) {
        // Add debugging timestamp to help identify when data was last processed
        const statsWithDebug = {
          ...stats,
          debugTimestamp: new Date().toISOString(),
        };

        setAdminStats(statsWithDebug as unknown as AdminStats);
        lastRefreshTimeRef.current = new Date();

        // Schedule next auto-refresh - reduced from 5 min to 1 min to keep data fresh
        refreshTimeoutRef.current = setTimeout(() => {
          fetchStats();
        }, 60000); // 1 minute refresh interval
      }

      // Always set loading to false after processing, even if no stats
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
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

      // For critical status change events, refresh immediately without debounce
      if (
        eventType === AdminEvents.USER_SUSPENDED ||
        eventType === AdminEvents.USER_REACTIVATED ||
        eventType === AdminEvents.USER_REJECTED ||
        eventType === AdminEvents.USER_APPROVED ||
        eventType === "FORCE_DASHBOARD_SYNC"
      ) {
        console.log(`Immediate refresh for critical user status change: ${eventType}`);
        
        // Always clear cache first
        if (window.adminUser) {
          window.adminUser.clearAdminStatsCache();
          window.adminUser.clearUserCache();
        }
        
        // Force refresh with slight delay to allow backend to fully process
        setTimeout(() => {
          //console.log(`Executing high-priority refresh for: ${eventType}`);
          fetchStats();
          
          // Double-check the refresh with a second call after short delay
          setTimeout(() => {
            //console.log(`Double-checking refresh for: ${eventType}`);
            fetchStats();
          }, 1500);
        }, 500);
        
        return;
      }

      // For other events, use debounce
      setTimeout(() => {
        fetchStats();
      }, 1500);
    };

    // Handle admin actions with the debounced handler
    const handleAdminAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventType = customEvent.detail.type;

      console.log(`Admin action detected: ${eventType}`);
      if (
        eventType === AdminEvents.USER_DELETED ||
        eventType === AdminEvents.USER_PROFILE_UPDATED ||
        eventType === AdminEvents.USER_APPROVED ||
        eventType === AdminEvents.USER_REJECTED ||
        eventType === AdminEvents.USER_SUSPENDED ||
        eventType === AdminEvents.USER_REACTIVATED ||
        eventType === AdminEvents.USER_ROLE_UPDATED ||
        eventType === AdminEvents.USER_CREATED ||
        eventType === "FORCE_DASHBOARD_SYNC" // Special event for forced refresh
      ) {
        console.log("Action requires refresh, initiating immediate or debounced refresh");
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
          //logDebug(
          //  "Tab became visible after 30+ seconds, checking for updates...",
          //);
          // Remove the data change detected code - instead just refresh silently
          fetchStats();
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
  // const logDebug = (message: string) => {
  //   console.log(`DEBUG: ${message}`);
  // };

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
    //logDebug("Manual refresh requested");

    // Set loading state
    setIsLoading(true);

    // Clear cache first
    clearAdminStatsCache();

    // Force a counter increment to trigger the useEffect
    setForceRefreshCounter((prev) => prev + 1);

    // Refresh the data
    fetchStats()
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
    //console.log("Admin dashboard mounting, clearing all caches");
    clearAdminStatsCache(); // Always clear cache on mount
    clearUserCache(); // Also clear user cache to ensure consistency

    // Set a very short delay before initial load to prevent blocking UI render
    // This ensures the parent component's loading state completes first
    setTimeout(() => {
      fetchStats();
    }, 100);

    // Set up event listener for admin actions with improved handling
    const handleAdminAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventType = customEvent.detail.type;

      //logDebug(`Admin action detected: ${eventType}`);
      if (
        eventType === AdminEvents.USER_DELETED ||
        eventType === AdminEvents.USER_PROFILE_UPDATED ||
        eventType === AdminEvents.USER_APPROVED ||
        eventType === AdminEvents.USER_REJECTED ||
        eventType === AdminEvents.USER_SUSPENDED ||
        eventType === AdminEvents.USER_REACTIVATED ||
        eventType === AdminEvents.USER_ROLE_UPDATED ||
        eventType === AdminEvents.USER_CREATED ||
        eventType === "FORCE_DASHBOARD_SYNC" // Special event for forced refresh
      ) {
        //logDebug(`Refreshing after admin action: ${eventType}`);
        // Add a small delay to ensure backend processing is complete
        setTimeout(() => {
          //console.log(`Triggering refresh due to admin action: ${eventType}`);
          // Force increment to trigger UI rerenders
          setForceRefreshCounter((prev) => prev + 1);
          // Always force refresh from API
          fetchStats();
        }, 1000);
      }
    };

    document.addEventListener("adminAction", handleAdminAction);

    // Add a listener for the special manual refresh event
    const handleManualRefresh = () => {
      //logDebug("Manual refresh event received");
      fetchStats();
    };

    document.addEventListener("manualRefresh", handleManualRefresh);

    // Cleanup function
    return () => {
      document.removeEventListener("adminAction", handleAdminAction);
      document.removeEventListener("manualRefresh", handleManualRefresh);

      // Clear any pending refresh timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchStats]);

  // Also refresh whenever force refresh counter changes
  useEffect(() => {
    if (forceRefreshCounter > 0) {
      //logDebug(`Force refresh counter changed: ${forceRefreshCounter}`);
      fetchStats();
    }
  }, [forceRefreshCounter, fetchStats]);

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

    return () => {
      //console.log("Debounced handler received event");

      // Clear any pending refreshes
      if (timeout) {
        //console.log("Cancelling previous pending refresh");
        clearTimeout(timeout);
      }

      // If already refreshing, just schedule a final refresh
      if (isRefreshing) {
        //console.log("Already refreshing, scheduling final refresh only");
        timeout = setTimeout(() => {
          //console.log("Executing final debounced refresh");
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
      //console.log("Starting debounced refresh sequence");

      // Clear cache immediately
      if (window.adminUser) {
        window.adminUser.clearAdminStatsCache();
      }

      // Set a delayed refresh
      timeout = setTimeout(() => {
        //console.log("Executing debounced refresh");
        // This would ideally call  fetchStats function directly
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* User Email Filter */}
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
                  {/* Action Filter Dropdown */}
                  <div className="flex-1">
                    <label
                      htmlFor="actionFilter"
                      className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Filter by Action
                    </label>
                    <select
                      id="actionFilter"
                      value={actionFilter}
                      onChange={(e) => {
                        setActionFilter(e.target.value);
                        setCurrentPage(1); // Reset page on filter change
                      }}
                      className="w-full p-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                      <option value="">All Actions</option>
                      {possibleActions.map((action) => (
                        <option key={action} value={action}>
                          {formatActionName(action)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Admin Email Filter */}
                  <div className="flex-1">
                    <label
                      htmlFor="adminEmailFilter"
                      className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Filter by Admin Email
                    </label>
                    <input
                      type="text"
                      id="adminEmailFilter"
                      value={adminEmailFilter}
                      onChange={(e) => {
                        setAdminEmailFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Enter admin email"
                      className="w-full p-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>
                  {/* Date Range Filter */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="startDateFilter"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="startDateFilter"
                        value={startDateFilter}
                        onChange={(e) => {
                          setStartDateFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full p-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="endDateFilter"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        End Date
                      </label>
                      <input
                        type="date"
                        id="endDateFilter"
                        value={endDateFilter}
                        onChange={(e) => {
                          setEndDateFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full p-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setUserFilter("");
                        setActionFilter("");
                        setAdminEmailFilter("");
                        setStartDateFilter("");
                        setEndDateFilter("");
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
                      // Filter activities based on current filters
                      adminStats.recentActivity
                        .filter((activity) => {
                          // User Email Filter
                          const emailMatches = (() => {
                            if (!userFilter) return true;
                            const email =
                              activity.resourceId ||
                              (activity.details &&
                                (activity.details.email as string)) ||
                              "";
                            return email
                              .toLowerCase()
                              .includes(userFilter.toLowerCase());
                          })();

                          // Action Filter
                          const actionMatches = actionFilter
                            ? // Special handling for USER_UPDATED action
                              actionFilter === "USER_UPDATED"
                              ? activity.action === "USER_PROFILE_UPDATED"
                              : activity.action === actionFilter
                            : true;

                          // Admin Email Filter
                          const adminEmailMatches = adminEmailFilter
                            ? (activity.performedBy || "")
                                .toLowerCase()
                                .includes(adminEmailFilter.toLowerCase())
                            : true;

                          // Date Range Filter
                          const activityDate = new Date(activity.timestamp);
                          // Adjust start date to beginning of the day (local time)
                          const startDate = startDateFilter
                            ? new Date(startDateFilter + "T00:00:00")
                            : null;
                          // Adjust end date to end of the day (local time)
                          const endDate = endDateFilter
                            ? new Date(endDateFilter + "T23:59:59.999")
                            : null;

                          const dateMatches =
                            (!startDate || activityDate >= startDate) &&
                            (!endDate || activityDate <= endDate);

                          return (
                            emailMatches &&
                            actionMatches &&
                            adminEmailMatches &&
                            dateMatches
                          ); // Combine all filters
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
                      // User Email Filter
                      const emailMatches = (() => {
                        if (!userFilter) return true;
                        const email =
                          activity.resourceId ||
                          (activity.details &&
                            (activity.details.email as string)) ||
                          "";
                        return email
                          .toLowerCase()
                          .includes(userFilter.toLowerCase());
                      })();

                      // Action Filter
                      const actionMatches = actionFilter
                        ? // Special handling for USER_UPDATED action
                          actionFilter === "USER_UPDATED"
                          ? activity.action === "USER_PROFILE_UPDATED"
                          : activity.action === actionFilter
                        : true;

                      // Admin Email Filter
                      const adminEmailMatches = adminEmailFilter
                        ? (activity.performedBy || "")
                            .toLowerCase()
                            .includes(adminEmailFilter.toLowerCase())
                        : true;

                      // Date Range Filter
                      const activityDate = new Date(activity.timestamp);
                      const startDate = startDateFilter
                        ? new Date(startDateFilter + "T00:00:00")
                        : null;
                      const endDate = endDateFilter
                        ? new Date(endDateFilter + "T23:59:59.999")
                        : null;

                      const dateMatches =
                        (!startDate || activityDate >= startDate) &&
                        (!endDate || activityDate <= endDate);

                      return (
                        emailMatches &&
                        actionMatches &&
                        adminEmailMatches &&
                        dateMatches
                      ); // Combine all filters
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
    USER_PROFILE_UPDATED: "User Profile Updated",
    USER_DELETED: "User Deleted",
    USER_UPDATED: "User Profile Updated", // Add mapping for backward compatibility
    ASSESSMENT_CREATED: "Assessment Created",
    ASSESSMENT_COMPLETED: "Assessment Completed",
    ASSESSMENT_DELETED: "Assessment Deleted",
    // Keep this for backward compatibility with existing data
    USER_STATUS_UPDATED: "Status Updated", // This might be obsolete now
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
  // Rejection actions - orange
  else if (action.includes("REJECTED")) {
    return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300";
  }
  // Deletion actions - red
  else if (action.includes("DELETED")) {
    return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300";
  }
  // Suspension actions - yellow
  else if (action.includes("SUSPENDED")) {
    return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300";
  }
  // Update actions - purple - handle both USER_PROFILE_UPDATED and USER_UPDATED
  else if (
    action === "USER_ROLE_UPDATED" ||
    action === "USER_PROFILE_UPDATED" ||
    action === "USER_UPDATED"
  ) {
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
      case "USER_PROFILE_UPDATED":
      case "USER_UPDATED": // Handle both for backward compatibility
        return (
          <span>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              Profile updated
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getAdminInfo(activity.performedBy)}
            </span>
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
            <strong className="text-orange-600 dark:text-orange-400">
              Rejected
            </strong>{" "}
            {/* Changed text color to orange */}
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
            <strong className="text-yellow-600 dark:text-yellow-400">
              {" "}
              {/* Changed text color to yellow */}
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
