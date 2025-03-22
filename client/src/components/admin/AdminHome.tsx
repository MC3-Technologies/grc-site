import { useEffect, useState } from "react";
import { fetchAdminStats, type AuditLog as BackendAuditLog } from "../../utils/adminUser";
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

export default function AdminHome() {
  const [adminStats, setAdminStats] = useState<AdminStatistics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const stats = await fetchAdminStats();
        console.log("Admin stats:", stats);
        if (stats) {
          setAdminStats(stats as unknown as AdminStatistics);
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing dashboard stats...");
      fetchStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <>
          {/* User Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* Total Users Card */}
            <StatCard
              title="Total Users"
              value={adminStats?.users?.total || (Array.isArray(adminStats?.users) ? adminStats?.users?.length : 0)}
              icon={<UserGroupIcon className="h-8 w-8 text-primary-600" />}
              color="blue"
              onClick={() => navigateTo('users')}
              clickable={true}
            />
            
            {/* Active Users Card */}
            <StatCard
              title="Active Users"
              value={adminStats?.users?.active || (Array.isArray(adminStats?.users) 
                ? adminStats?.users?.filter(u => u.status === 'ACTIVE')?.length 
                : 0)}
              icon={<UserIcon className="h-8 w-8 text-green-600" />}
              color="green"
              onClick={() => navigateTo('users', 'tab=active')}
              clickable={true}
            />
            
            {/* Pending Users Card */}
            <StatCard
              title="Pending Approval"
              value={adminStats?.users?.pending || (Array.isArray(adminStats?.users) 
                ? adminStats?.users?.filter(u => u.status === 'PENDING')?.length 
                : 0)}
              icon={<ClockIcon className="h-8 w-8 text-yellow-600" />}
              color="yellow"
              onClick={() => navigateTo('users', 'tab=pending')}
              clickable={true}
            />
            
            {/* Rejected Users Card */}
            <StatCard
              title="Rejected Users"
              value={adminStats?.users?.rejected || (Array.isArray(adminStats?.users) 
                ? adminStats?.users?.filter(u => u.status === 'REJECTED')?.length 
                : 0)}
              icon={<XCircleIcon className="h-8 w-8 text-red-600" />}
              color="red"
              onClick={() => navigateTo('users', 'tab=rejected')}
              clickable={true}
            />
            
            {/* Suspended Users Card */}
            <StatCard
              title="Suspended Users"
              value={adminStats?.users?.suspended || (Array.isArray(adminStats?.users) 
                ? adminStats?.users?.filter(u => u.status === 'SUSPENDED')?.length 
                : 0)}
              icon={<NoSymbolIcon className="h-8 w-8 text-orange-600" />}
              color="orange"
              onClick={() => navigateTo('users', 'tab=suspended')}
              clickable={true}
            />
          </div>

          {/* Assessment Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Assessments Card */}
            <StatCard
              title="Total Assessments"
              value={adminStats?.assessments?.total || 0}
              icon={<DocumentTextIcon className="h-8 w-8 text-primary-600" />}
              color="blue"
              onClick={() => navigateTo('assessments')}
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
              onClick={() => navigateTo('assessments')}
              clickable={true}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Add user card */}
              <div
                className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${activeTab === 'users' ? 'active-card' : ''}`}
                onClick={() => navigateTo('users')}
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
                className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${activeTab === 'assessments' ? 'active-card' : ''}`}
                onClick={() => navigateTo('assessments')}
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
                onClick={() => navigateTo('settings')}
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Admin Activities
            </h2>
            
            <div className="overflow-x-auto relative">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="py-3 px-6">Time</th>
                    <th scope="col" className="py-3 px-6">Action</th>
                    <th scope="col" className="py-3 px-6">Admin</th>
                    <th scope="col" className="py-3 px-6">Resource</th>
                    <th scope="col" className="py-3 px-6">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {adminStats?.recentActivity && adminStats.recentActivity.length > 0 ? (
                    adminStats.recentActivity.map((activity) => (
                      <tr key={activity.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <td className="py-4 px-6">
                          {new Date(activity.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeStyle(activity.action)}`}>
                            {formatActionName(activity.action)}
                          </span>
                        </td>
                        <td className="py-4 px-6">{activity.performedBy || 'System'}</td>
                        <td className="py-4 px-6">
                          {activity.affectedResource} 
                          {activity.resourceId && (
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              {activity.details?.email as string || activity.resourceId}
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
  const actionMap: {[key: string]: string} = {
    'USER_APPROVED': 'User Approved',
    'USER_REJECTED': 'User Rejected',
    'USER_SUSPENDED': 'User Suspended',
    'USER_REACTIVATED': 'User Reactivated',
    'USER_CREATED': 'User Created',
    'USER_ROLE_UPDATED': 'Role Updated',
    'USER_DELETED': 'User Deleted',
    'ASSESSMENT_CREATED': 'Assessment Created', 
    'ASSESSMENT_COMPLETED': 'Assessment Completed',
    'ASSESSMENT_DELETED': 'Assessment Deleted'
  };
  
  return actionMap[action] || action.replace(/_/g, ' ');
};

// Function to determine the badge style based on action
const getActionBadgeStyle = (action: string): string => {
  if (action.includes('APPROVED') || action.includes('REACTIVATED')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  } else if (action.includes('REJECTED') || action.includes('DELETED')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  } else if (action.includes('SUSPENDED')) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  } else if (action.includes('CREATED')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  } else if (action.includes('UPDATED') || action.includes('ROLE')) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
  } else {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// Function to format activity details
const formatActivityDetails = (activity: BackendAuditLog): JSX.Element => {
  if (!activity.details) return <></>;
  
  // Time-related properties to exclude from the details display
  const timeKeys = ['timestamp', 'createdAt', 'updatedAt', 'completedAt'];
  
  // Find the first available time value to display
  const getTimeValue = (details: Record<string, unknown>, defaultTime: string): string => {
    const timeKey = timeKeys.find(key => details[key]);
    return timeKey && details[timeKey] 
      ? details[timeKey] as string 
      : defaultTime;
  };
  
  // Extract the most relevant details based on action type
  switch(activity.action) {
    case 'USER_ROLE_UPDATED':
      return (
        <span>
          Changed role to <strong>{activity.details.newRole}</strong>
          {activity.details.updatedAt && 
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              on {new Date(activity.details.updatedAt as string).toLocaleString()}
            </span>
          }
        </span>
      );
    case 'USER_APPROVED':
      return (
        <span>
          <strong>Approved</strong> on {activity.details.approvedAt ? 
            new Date(activity.details.approvedAt as string).toLocaleString() :
            new Date(activity.timestamp).toLocaleString()}
        </span>
      );
    case 'USER_REACTIVATED':
      return (
        <span>
          <strong>Reactivated</strong> on {activity.details.reactivatedAt ? 
            new Date(activity.details.reactivatedAt as string).toLocaleString() :
            new Date(activity.timestamp).toLocaleString()}
        </span>
      );
    case 'USER_REJECTED':
      return (
        <span>
          <strong>Rejected</strong>
          {activity.details.rejectedAt && 
            <span className="block text-xs">
              on {new Date(activity.details.rejectedAt as string).toLocaleString()}
            </span>
          }
          {activity.details.reason && 
            <span className="block text-xs italic mt-1">
              Reason: "{activity.details.reason}"
            </span>
          }
        </span>
      );
    case 'USER_SUSPENDED':
      return (
        <span>
          <strong>Suspended</strong>
          {activity.details.suspendedAt && 
            <span className="block text-xs">
              on {new Date(activity.details.suspendedAt as string).toLocaleString()}
            </span>
          }
          {activity.details.reason && 
            <span className="block text-xs italic mt-1">
              Reason: "{activity.details.reason}"
            </span>
          }
        </span>
      );
    case 'USER_CREATED':
      return (
        <span>
          Role: <strong>{activity.details.role || "user"}</strong>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            Created on {new Date(activity.details.createdAt as string || activity.timestamp).toLocaleString()}
          </span>
        </span>
      );
    case 'USER_DELETED':
      return (
        <span>
          <strong>Deleted</strong> on {activity.details.deletedAt ? 
            new Date(activity.details.deletedAt as string).toLocaleString() : 
            new Date(activity.timestamp).toLocaleString()}
        </span>
      );
    default: {
      // For any other action types, try to extract and display the most relevant information
      const timeValue = getTimeValue(activity.details, activity.timestamp);
      
      return (
        <span>
          {Object.entries(activity.details)
            .filter(([key]) => !timeKeys.includes(key))
            .map(([key, value]) => (
              typeof value === 'object' ? null : 
              <span key={key} className="block">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: 
                <strong> {String(value)}</strong>
              </span>
            ))}
          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(timeValue as string).toLocaleString()}
          </span>
        </span>
      );
    }
  }
};
