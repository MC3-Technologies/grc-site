// File: client/src/components/admin/AdminUsers.tsx
import { useState, useEffect, useMemo } from "react";
import {
  User,
  fetchUsers,
  fetchUsersByStatus,
  refreshUserData,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  deleteUser,
  getUserStatus,
  getClientSchema,
  createTestUser,
} from "../../utils/adminUser";
import { getCurrentUser } from "../../amplify/auth";
import Spinner from "../Spinner";

// Interface to match our component needs
interface UserData {
  email: string;
  status: "active" | "pending" | "suspended" | "rejected";
  role: "user" | "admin";
  created: string;
  lastLogin?: string;
  enabled: boolean;
  customStatus?: string | null;
}

// Add interface for new user form
interface NewUserForm {
  email: string;
  password: string;
  role: "user" | "admin";
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]); // New state to track all users for counts
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(
    null,
  );
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [timeCounter, setTimeCounter] = useState(0); // Add a counter state to force re-renders

  // Add state for new user modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    email: "",
    password: "",
    role: "user",
  });

  // Set up a timer that updates every second to refresh the "time since last update" display
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeCounter((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    // Get the tab parameter from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }

    fetchUsers();
  }, []);

  // Auto-dismiss messages after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 7000); // Auto-dismiss after 7 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch current admin email
  useEffect(() => {
    const getAdminEmail = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser && currentUser.email) {
          setCurrentAdminEmail(currentUser.email);
        }
      } catch (error) {
        console.error("Error getting current admin email:", error);
      }
    };

    getAdminEmail();
  }, []);

  // Function to transform API user data into the format we need
  const transformUserData = (fetchedUsers: User[]): UserData[] => {
    if (!fetchedUsers || !Array.isArray(fetchedUsers)) {
      console.error("Invalid user data received:", fetchedUsers);
      return [];
    }

    // Helper function to determine user role
    const determineUserRole = (user: User): "user" | "admin" => {
      if (user.attributes?.["cognito:groups"]) {
        try {
          const groups = JSON.parse(user.attributes["cognito:groups"]);
          if (Array.isArray(groups) && groups.includes("GRC-Admin")) {
            return "admin";
          }
        } catch {
          console.warn("Failed to parse groups from user attributes");
        }
      }

      return (user.attributes?.["custom:role"] as "user" | "admin") || "user";
    };

    // Transform the API data
    return fetchedUsers
      .map((user) => {
        if (!user || !user.email) {
          console.warn("Invalid user object in response:", user);
          return null;
        }

        return {
          email: user.attributes?.email || user.email,
          status: getUserStatus(
            user.status || "",
            Boolean(user.enabled),
            user.customStatus || undefined,
          ),
          role: determineUserRole(user),
          created: user.created,
          lastLogin: user.lastModified,
          enabled: user.enabled,
          customStatus: user.customStatus,
        };
      })
      .filter(Boolean) as UserData[]; // Remove any null entries
  };

  // Fetch all users for counting badges and establish auto-refresh
  useEffect(() => {
    // Function to fetch and update all user data
    const fetchAndUpdateAllData = async () => {
      try {
        setAutoRefreshing(true);

        // Fetch all users with forceRefresh to bypass cache
        const allFetchedUsers = await fetchUsers(true);
        const transformedAllUsers = transformUserData(allFetchedUsers);
        setAllUsers(transformedAllUsers);

        // If we're on the "all" tab, update the main users list too
        if (activeTab === "all") {
          setUsers(transformedAllUsers);
        } else {
          // Otherwise, fetch and update the filtered users for the current tab
          const filteredUsers = await fetchUsersByStatus(
            activeTab as "pending" | "active" | "suspended" | "rejected",
            true,
          );
          setUsers(transformUserData(filteredUsers));
        }

        // Update last refresh timestamp
        setLastRefreshTime(new Date());
      } catch (err) {
        console.error("Error during auto-refresh:", err);
        // Don't show error message on auto-refresh to avoid disrupting the user
      } finally {
        setAutoRefreshing(false);
      }
    };

    // Initial fetch
    fetchAndUpdateAllData();

    // Set up auto-refresh interval (every 30 seconds)
    const refreshInterval = setInterval(fetchAndUpdateAllData, 30 * 1000);

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [activeTab]); // Re-establish interval when active tab changes

  // Load users for the current tab view - only initial loading
  useEffect(() => {
    const initialLoadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Initial loading of users");
        // Initial loading will be handled by the auto-refresh effect
        setLoading(false);
      } catch (err) {
        console.error("Error in initial loading:", err);
        if (err instanceof Error) {
          setError(`An error occurred: ${err.message}`);
        } else {
          setError(`An error occurred: ${String(err)}`);
        }
        setUsers([]); // Ensure users is empty on error
        setLoading(false);
      }
    };

    initialLoadUsers();
    // Only run on initial mount, not when activeTab changes
  }, []);

  // Handle user approval
  const handleApproveUser = async (email: string) => {
    setActionInProgress(email);
    setError(null);
    setSuccess(null);

    try {
      const response = await approveUser(email, currentAdminEmail || undefined);
      console.log(`Approve user response for ${email}:`, response);

      if (response) {
        setSuccess(`User ${email} has been approved.`);

        // Refresh data to ensure UI is up to date (this will clear cache)
        await refreshUserData();

        // Update current view immediately by fetching fresh data
        const refreshedUsers =
          activeTab === "all"
            ? await fetchUsers(true)
            : await fetchUsersByStatus(
                activeTab as "pending" | "active" | "suspended" | "rejected",
                true,
              );

        setUsers(transformUserData(refreshedUsers));
        setLastRefreshTime(new Date());
      } else {
        setError(`Failed to approve user ${email}.`);
      }
    } catch (error) {
      console.error("Error approving user:", error);
      if (error instanceof Error) {
        setError(`An error occurred: ${error.message}`);
      } else {
        setError(`An error occurred: ${String(error)}`);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle user rejection
  const handleRejectUser = async (email: string) => {
    // In a real implementation, we'd show a confirmation dialog
    // and possibly collect a reason for rejection
    const reason =
      "Your account request has been rejected by an administrator.";

    setActionInProgress(email);
    setError(null);
    setSuccess(null);

    try {
      const response = await rejectUser(
        email,
        reason,
        currentAdminEmail || undefined,
      );

      if (response) {
        setSuccess(`User ${email} has been rejected.`);

        // Refresh data to ensure UI is up to date (this will clear cache)
        await refreshUserData();

        // Update current view immediately by fetching fresh data
        const refreshedUsers =
          activeTab === "all"
            ? await fetchUsers(true)
            : await fetchUsersByStatus(
                activeTab as "pending" | "active" | "suspended" | "rejected",
                true,
              );

        setUsers(transformUserData(refreshedUsers));
        setLastRefreshTime(new Date());
      } else {
        setError(`Failed to reject user ${email}.`);
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      if (error instanceof Error) {
        setError(`An error occurred: ${error.message}`);
      } else {
        setError(`An error occurred: ${String(error)}`);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle user suspension
  const handleSuspendUser = async (email: string) => {
    // In a real implementation, we'd show a confirmation dialog
    // and possibly collect a reason for suspension
    const reason = "Your account has been suspended by an administrator.";

    setActionInProgress(email);
    setError(null);
    setSuccess(null);

    try {
      const response = await suspendUser(
        email,
        reason,
        currentAdminEmail || undefined,
      );

      if (response) {
        setSuccess(`User ${email} has been suspended.`);

        // Refresh data to ensure UI is up to date (this will clear cache)
        await refreshUserData();

        // Update current view immediately by fetching fresh data
        const refreshedUsers =
          activeTab === "all"
            ? await fetchUsers(true)
            : await fetchUsersByStatus(
                activeTab as "pending" | "active" | "suspended" | "rejected",
                true,
              );

        setUsers(transformUserData(refreshedUsers));
        setLastRefreshTime(new Date());
      } else {
        setError(`Failed to suspend user ${email}.`);
      }
    } catch (error) {
      console.error("Error suspending user:", error);
      if (error instanceof Error) {
        setError(`An error occurred: ${error.message}`);
      } else {
        setError(`An error occurred: ${String(error)}`);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle user reactivation
  const handleReactivateUser = async (email: string) => {
    setActionInProgress(email);
    setError(null);
    setSuccess(null);

    try {
      const response = await reactivateUser(
        email,
        currentAdminEmail || undefined,
      );
      console.log(`Reactivate user response for ${email}:`, response);

      if (response) {
        setSuccess(`User ${email} has been reactivated.`);

        // Refresh data to ensure UI is up to date (this will clear cache)
        await refreshUserData();

        // Update current view immediately by fetching fresh data
        const refreshedUsers =
          activeTab === "all"
            ? await fetchUsers(true)
            : await fetchUsersByStatus(
                activeTab as "pending" | "active" | "suspended" | "rejected",
                true,
              );

        setUsers(transformUserData(refreshedUsers));
        setLastRefreshTime(new Date());
      } else {
        setError(`Failed to reactivate user ${email}.`);
      }
    } catch (error) {
      console.error("Error reactivating user:", error);
      if (error instanceof Error) {
        setError(`An error occurred: ${error.message}`);
      } else {
        setError(`An error occurred: ${String(error)}`);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (email: string) => {
    setUserToDelete(null);
    setIsDeleteModalOpen(false);
    setActionInProgress(email);
    setError(null);
    setSuccess(null);

    try {
      const response = await deleteUser(email, currentAdminEmail || undefined);
      console.log(`Delete user response for ${email}:`, response);

      if (response.success) {
        setSuccess(response.message || `User ${email} has been deleted.`);

        // Refresh data to ensure UI is up to date (this will clear cache)
        await refreshUserData();

        // Update current view immediately by fetching fresh data
        const refreshedUsers =
          activeTab === "all"
            ? await fetchUsers(true)
            : await fetchUsersByStatus(
                activeTab as "pending" | "active" | "suspended" | "rejected",
                true,
              );

        setUsers(transformUserData(refreshedUsers));

        // Also update the allUsers state for badge counts without requiring tab change
        const allFetchedUsers = await fetchUsers(true);
        setAllUsers(transformUserData(allFetchedUsers));

        setLastRefreshTime(new Date());
      } else {
        setError(response.message || `Failed to delete user ${email}.`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof Error) {
        setError(`An error occurred: ${error.message}`);
      } else {
        setError(`An error occurred: ${String(error)}`);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "active":
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
            Active
          </span>
        );
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
            Pending
          </span>
        );
      case "suspended":
        return (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
            Suspended
          </span>
        );
      case "rejected":
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
            Rejected
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  // Get filtered users based on active tab
  const getFilteredUsers = () => {
    if (activeTab === "pending") {
      return users.filter((user) => user.status === "pending");
    } else if (activeTab === "rejected") {
      return users.filter((user) => user.status === "rejected");
    } else if (activeTab === "suspended") {
      return users.filter((user) => user.status === "suspended");
    }
    return users;
  };

  // Handle opening the edit modal
  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  // Handle closing the edit modal
  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  // Handle saving user edits
  const handleSaveUserEdits = async (updatedUser: UserData) => {
    setActionInProgress(updatedUser.email);
    setError(null);
    setSuccess(null);

    try {
      const client = getClientSchema();
      console.log(
        `Updating role for ${updatedUser.email} to ${updatedUser.role} by admin: ${currentAdminEmail || "unknown"}`,
      );

      const response = await client.mutations.updateUserRole({
        email: updatedUser.email,
        role: updatedUser.role,
        adminEmail: currentAdminEmail || undefined,
      });

      console.log("Update user role response:", response);

      if (response && response.data) {
        setSuccess(
          `User ${updatedUser.email}'s role updated successfully to ${updatedUser.role}`,
        );

        // Refresh data to ensure UI is up to date
        await refreshUserData();

        // Update both users and allUsers states
        setUsers((prev) =>
          prev.map((user) =>
            user.email === updatedUser.email ? updatedUser : user,
          ),
        );

        setAllUsers((prev) =>
          prev.map((user) =>
            user.email === updatedUser.email ? updatedUser : user,
          ),
        );

        setLastRefreshTime(new Date());
      } else {
        setError(`Failed to update role for ${updatedUser.email}`);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      if (error instanceof Error) {
        setError(`Error updating role: ${error.message}`);
      } else {
        setError(`Error updating role: ${String(error)}`);
      }
    } finally {
      setActionInProgress(null);
      handleCloseEditModal();
    }
  };

  // Format last refresh time - use useMemo with timeCounter as dependency to refresh every second
  const formattedLastRefreshTime = useMemo(() => {
    if (!lastRefreshTime) return "Not yet refreshed";

    // Get current time - using timeCounter to ensure dependency is used
    const now = new Date(Date.now() + timeCounter * 0);
    const diff = now.getTime() - lastRefreshTime.getTime();

    // If less than a minute, show seconds
    if (diff < 60000) {
      const seconds = Math.floor(diff / 1000);
      return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
    }

    // If less than an hour, show minutes
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    }

    // Otherwise show the full time
    return lastRefreshTime.toLocaleTimeString();
  }, [lastRefreshTime, timeCounter]); // Re-calculate when either lastRefreshTime changes or timeCounter changes

  // Add function to handle form input changes
  const handleNewUserInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewUserForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add function to create test user
  const handleCreateTestUser = async () => {
    setActionInProgress("creating");
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!newUserForm.email || !newUserForm.password) {
        setError("Email and password are required");
        setActionInProgress(null);
        return;
      }

      const response = await createTestUser({
        email: newUserForm.email,
        password: newUserForm.password,
        role: newUserForm.role,
        adminEmail: currentAdminEmail || undefined,
      });

      if (response && response.success) {
        setSuccess(
          `Test user ${newUserForm.email} has been created successfully.`,
        );

        // Close modal and reset form
        setIsAddUserModalOpen(false);
        setNewUserForm({
          email: "",
          password: "",
          role: "user",
        });

        // Refresh data
        await refreshUserData();
        const refreshedUsers = await fetchUsers(true);
        setUsers(transformUserData(refreshedUsers));
        setAllUsers(transformUserData(refreshedUsers));
        setLastRefreshTime(new Date());
      } else {
        setError(response?.message || "Failed to create test user.");
      }
    } catch (error) {
      console.error("Error creating test user:", error);
      if (error instanceof Error) {
        setError(`An error occurred: ${error.message}`);
      } else {
        setError(`An error occurred: ${String(error)}`);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div>
      {/* Alert messages */}
      {error && (
        <div
          className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300 shadow-md animate-fadeIn"
          role="alert"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span>{error}</span>
            </div>
            <button
              className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
              onClick={() => setError(null)}
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div
          className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300 shadow-md animate-fadeIn"
          role="alert"
        >
          <div className="flex justify-between items-center">
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
            <button
              className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
              onClick={() => setSuccess(null)}
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "all"
                    ? "border-primary-600 text-white bg-primary-600 dark:bg-primary-700 dark:text-white dark:border-primary-500"
                    : "border-transparent text-white bg-gray-700 hover:text-black hover:bg-gray-200 hover:border-gray-300 dark:text-gray-100 dark:bg-gray-800 dark:hover:text-white"
                }`}
              >
                All Users
                {allUsers.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                    {allUsers.length}
                  </span>
                )}
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("pending")}
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "pending"
                    ? "border-primary-600 text-white bg-primary-600 dark:bg-primary-700 dark:text-white dark:border-primary-500"
                    : "border-transparent text-white bg-gray-700 hover:text-black hover:bg-gray-200 hover:border-gray-300 dark:text-gray-100 dark:bg-gray-800 dark:hover:text-white"
                }`}
              >
                Pending Approval
                {allUsers.filter((user) => user.status === "pending").length >
                  0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                    {
                      allUsers.filter((user) => user.status === "pending")
                        .length
                    }
                  </span>
                )}
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("rejected")}
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "rejected"
                    ? "border-primary-600 text-white bg-primary-600 dark:bg-primary-700 dark:text-white dark:border-primary-500"
                    : "border-transparent text-white bg-gray-700 hover:text-black hover:bg-gray-200 hover:border-gray-300 dark:text-gray-100 dark:bg-gray-800 dark:hover:text-white"
                }`}
              >
                Rejected
                {allUsers.filter((user) => user.status === "rejected").length >
                  0 && (
                  <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                    {
                      allUsers.filter((user) => user.status === "rejected")
                        .length
                    }
                  </span>
                )}
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("suspended")}
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "suspended"
                    ? "border-primary-600 text-white bg-primary-600 dark:bg-primary-700 dark:text-white dark:border-primary-500"
                    : "border-transparent text-white bg-gray-700 hover:text-black hover:bg-gray-200 hover:border-gray-300 dark:text-gray-100 dark:bg-gray-800 dark:hover:text-white"
                }`}
              >
                Suspended
                {allUsers.filter((user) => user.status === "suspended").length >
                  0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                    {
                      allUsers.filter((user) => user.status === "suspended")
                        .length
                    }
                  </span>
                )}
              </button>
            </li>
          </ul>

          <div className="flex gap-2">
            {/* Add Test User button */}
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Add Test User
            </button>

            {/* Manual refresh button with tooltip */}
            <div className="relative group">
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    // Force refresh from API
                    await refreshUserData();

                    // Reload current data
                    const refreshedUsers =
                      activeTab === "all"
                        ? await fetchUsers(true)
                        : await fetchUsersByStatus(
                            activeTab as
                              | "pending"
                              | "active"
                              | "suspended"
                              | "rejected",
                            true,
                          );

                    setUsers(transformUserData(refreshedUsers));

                    // Refresh all users counts as well
                    const allFetchedUsers = await fetchUsers(true);
                    setAllUsers(transformUserData(allFetchedUsers));

                    // Update last refresh time
                    setLastRefreshTime(new Date());

                    // Notify the user
                    setSuccess("Data refreshed successfully");
                  } catch (error) {
                    console.error("Error refreshing data:", error);
                    setError("Failed to refresh data");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
                disabled={loading}
              >
                <svg
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
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
                {loading ? "Refreshing..." : "Manual Refresh"}
              </button>
              <div className="hidden group-hover:block absolute z-10 w-64 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                Data auto-refreshes every 30 seconds. Use this button only if
                you need immediate updates.
                <div className="absolute w-3 h-3 bg-gray-900 dark:bg-gray-700 transform rotate-45 left-1/2 -translate-x-1/2 bottom-[-6px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add last updated info after the tab navigation */}
      <div className="flex justify-end mb-4 text-xs text-gray-500 dark:text-gray-400 italic">
        <div className="flex items-center">
          {autoRefreshing ? (
            <svg
              className="w-3 h-3 mr-1 animate-spin"
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
          ) : (
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          )}
          Last updated: {formattedLastRefreshTime}
          {autoRefreshing && (
            <span className="ml-1 text-blue-500">Refreshing...</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Last Modified
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {getFilteredUsers().map((user) => (
                  <tr
                    key={user.email}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      {user.email}
                    </th>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 capitalize">{user.role}</td>
                    <td className="px-6 py-4">{formatDate(user.created)}</td>
                    <td className="px-6 py-4">
                      {formatDate(user.lastLogin || "")}
                    </td>
                    <td className="px-6 py-4 flex flex-col space-y-2">
                      {user.status === "pending" && (
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleApproveUser(user.email)}
                            disabled={actionInProgress === user.email}
                            className={`px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg w-full ${
                              actionInProgress === user.email
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-green-700"
                            }`}
                          >
                            {actionInProgress === user.email
                              ? "Processing..."
                              : "Approve"}
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.email)}
                            disabled={actionInProgress === user.email}
                            className={`px-3 py-1 text-xs font-medium text-white bg-orange-600 rounded-lg w-full ${
                              actionInProgress === user.email
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-orange-700"
                            }`}
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {user.status === "active" && (
                        <button
                          onClick={() => handleSuspendUser(user.email)}
                          disabled={actionInProgress === user.email}
                          className={`px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded-lg w-full ${
                            actionInProgress === user.email
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-yellow-700"
                          }`}
                        >
                          {actionInProgress === user.email
                            ? "Processing..."
                            : "Suspend"}
                        </button>
                      )}

                      {user.status === "suspended" && (
                        <button
                          onClick={() => handleReactivateUser(user.email)}
                          disabled={actionInProgress === user.email}
                          className={`px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg w-full ${
                            actionInProgress === user.email
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-blue-700"
                          }`}
                        >
                          {actionInProgress === user.email
                            ? "Processing..."
                            : "Reactivate"}
                        </button>
                      )}

                      {/* Only show Edit button for active and pending users */}
                      {(user.status === "active" ||
                        user.status === "pending") && (
                        <button
                          onClick={() => handleEditUser(user)}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg w-full hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          Edit
                        </button>
                      )}

                      {/* Delete button for all users except those being processed */}
                      {actionInProgress !== user.email && (
                        <button
                          onClick={() => {
                            setUserToDelete(user.email);
                            setIsDeleteModalOpen(true);
                          }}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-lg w-full hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {getFilteredUsers().length === 0 && (
            <div className="p-4 mt-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-300">
              No users found matching the selected filter.
            </div>
          )}
        </>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit User
                </h3>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <span className="sr-only">Close modal</span>✕
                </button>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Email
                  </label>
                  <input
                    type="text"
                    className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                    value={editingUser.email}
                    disabled
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Role
                  </label>
                  <select
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        role: e.target.value as "user" | "admin",
                      })
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="text-gray-500 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveUserEdits(editingUser)}
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm User Deletion
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <span className="sr-only">Close modal</span>✕
                </button>
              </div>
              <div className="p-4 md:p-5">
                <div className="mb-4 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                  <h3 className="mt-4 mb-2 text-lg font-medium text-gray-800 dark:text-gray-300">
                    Are you sure you want to delete this user?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You are about to delete{" "}
                    <span className="font-bold">{userToDelete}</span>. This
                    action cannot be undone and will permanently remove the user
                    and all associated data.
                  </p>
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setUserToDelete(null);
                    }}
                    className="text-gray-500 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(userToDelete)}
                    className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                  >
                    Yes, Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Test User
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <span className="sr-only">Close modal</span>✕
                </button>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    value={newUserForm.email}
                    onChange={handleNewUserInputChange}
                    placeholder="test@example.com"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    value={newUserForm.password}
                    onChange={handleNewUserInputChange}
                    placeholder="Password"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Role
                  </label>
                  <select
                    name="role"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    value={newUserForm.role}
                    onChange={handleNewUserInputChange}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="text-gray-500 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateTestUser}
                    disabled={actionInProgress === "creating"}
                    className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                  >
                    {actionInProgress === "creating"
                      ? "Creating..."
                      : "Create User"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
