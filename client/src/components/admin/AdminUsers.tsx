// File: client/src/components/admin/AdminUsers.tsx
import { useState, useEffect } from "react";
import {
  fetchUsers,
  fetchUsersByStatus,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  User,
  getUserStatus,
  refreshUserData,
  getClientSchema
} from "../../utils/adminUser";
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

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]); // New state to track all users for counts
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "rejected" | "suspended">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

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

  // Function to transform API user data into the format we need
  const transformUserData = (fetchedUsers: User[]): UserData[] => {
    if (!fetchedUsers || !Array.isArray(fetchedUsers)) {
      console.error("Invalid user data received:", fetchedUsers);
      return [];
    }

    // Helper function to determine user role
    const determineUserRole = (user: User): "user" | "admin" => {
      if (user.attributes?.['cognito:groups']) {
        try {
          const groups = JSON.parse(user.attributes['cognito:groups']);
          if (Array.isArray(groups) && groups.includes('GRC-Admin')) {
            return "admin";
          }
        } catch {
          console.warn('Failed to parse groups from user attributes');
        }
      }
      
      return (user.attributes?.["custom:role"] as "user" | "admin") || "user";
    };

    // Transform the API data
    return fetchedUsers.map((user) => {
      if (!user || !user.email) {
        console.warn("Invalid user object in response:", user);
        return null;
      }
      
      return {
        email: user.attributes?.email || user.email,
        status: getUserStatus(
          user.status || "", 
          Boolean(user.enabled), 
          user.customStatus || undefined
        ),
        role: determineUserRole(user),
        created: user.created,
        lastLogin: user.lastModified,
        enabled: user.enabled,
        customStatus: user.customStatus,
      };
    }).filter(Boolean) as UserData[]; // Remove any null entries
  };

  // Fetch all users for counting badges
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const allFetchedUsers = await fetchUsers();
        const transformedAllUsers = transformUserData(allFetchedUsers);
        setAllUsers(transformedAllUsers);
      } catch (err) {
        console.error("Error loading all users for counts:", err);
      }
    };

    fetchAllUsers();
    // Set up periodic refresh for user counts
    const refreshInterval = setInterval(fetchAllUsers, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Load users for the current tab view
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Loading users with activeTab: ${activeTab}`);
        let fetchedUsers: User[];

        if (activeTab === "pending") {
          console.log("Fetching users with pending status");
          fetchedUsers = await fetchUsersByStatus("pending");
        } else if (activeTab === "rejected") {
          console.log("Fetching users with rejected status");
          fetchedUsers = await fetchUsersByStatus("rejected");
        } else if (activeTab === "suspended") {
          console.log("Fetching users with suspended status");
          fetchedUsers = await fetchUsersByStatus("suspended");
        } else {
          console.log("Fetching all users");
          fetchedUsers = await fetchUsers();
          
          // Also update the allUsers state when fetching all users
          const transformedAllUsers = transformUserData(fetchedUsers);
          setAllUsers(transformedAllUsers);
        }
        
        console.log("Fetched users:", fetchedUsers);
        
        // Transform and set the users for the current view
        const transformedUsers = transformUserData(fetchedUsers);
        console.log("Transformed users:", transformedUsers);
        setUsers(transformedUsers);
      } catch (err) {
        console.error("Error loading users:", err);
        if (err instanceof Error) {
          setError(`An error occurred: ${err.message}`);
        } else {
          setError(`An error occurred: ${String(err)}`);
        }
        setUsers([]); // Ensure users is empty on error
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [activeTab]);

  // Handle user approval
  const handleApproveUser = async (email: string) => {
    setActionInProgress(email);
    setError(null);
    setSuccess(null);

    try {
      const response = await approveUser(email);
      console.log(`Approve user response for ${email}:`, response);
      
      if (response) {
        setSuccess(`User ${email} has been approved.`);
        
        // Refresh data to ensure UI is up to date
        await refreshUserData();
        
        // Update both users and allUsers states
        setUsers((prev) =>
          prev.map((user) =>
            user.email === email
              ? { 
                  ...user, 
                  status: "active", 
                  enabled: true,
                  customStatus: null // Clear any custom status
                }
              : user
          )
        );
        
        setAllUsers((prev) =>
          prev.map((user) =>
            user.email === email
              ? { 
                  ...user, 
                  status: "active", 
                  enabled: true,
                  customStatus: null
                }
              : user
          )
        );
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
    const reason = "Your account request has been rejected by an administrator.";

    setActionInProgress(email);
    setError(null);
    setSuccess(null);

    try {
      const response = await rejectUser(email, reason);
      console.log(`Reject user response for ${email}:`, response);
      
      if (response) {
        setSuccess(`User ${email} has been rejected.`);
        
        // Refresh data to ensure UI is up to date
        await refreshUserData();
        
        // Update both users and allUsers states
        setUsers((prev) =>
          prev.map((user) =>
            user.email === email
              ? { ...user, status: "rejected", enabled: false, customStatus: "REJECTED" }
              : user
          )
        );
        
        setAllUsers((prev) =>
          prev.map((user) =>
            user.email === email
              ? { ...user, status: "rejected", enabled: false, customStatus: "REJECTED" }
              : user
          )
        );
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
      const result = await suspendUser(email, reason);
      if (result) {
        setSuccess(`User ${email} has been suspended.`);

        // Update both users and allUsers states
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.email === email
              ? { ...user, status: "suspended", enabled: false }
              : user,
          ),
        );
        
        setAllUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.email === email
              ? { ...user, status: "suspended", enabled: false }
              : user,
          ),
        );
      } else {
        setError(`Failed to suspend user ${email}.`);
      }
    } catch (err) {
      console.error(`Error suspending user ${email}:`, err);
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError(`An error occurred: ${String(err)}`);
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
      const result = await reactivateUser(email);
      if (result) {
        setSuccess(`User ${email} has been reactivated.`);

        // Update both users and allUsers states
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.email === email
              ? { ...user, status: "active", enabled: true }
              : user,
          ),
        );
        
        setAllUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.email === email
              ? { ...user, status: "active", enabled: true }
              : user,
          ),
        );
      } else {
        setError(`Failed to reactivate user ${email}.`);
      }
    } catch (err) {
      console.error(`Error reactivating user ${email}:`, err);
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError(`An error occurred: ${String(err)}`);
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
      console.log(`Updating role for ${updatedUser.email} to ${updatedUser.role}`);
      
      const response = await client.mutations.updateUserRole({
        email: updatedUser.email,
        role: updatedUser.role,
      });
      
      console.log("Update user role response:", response);
      
      if (response && response.data) {
        setSuccess(`User ${updatedUser.email}'s role updated successfully to ${updatedUser.role}`);
        
        // Refresh data to ensure UI is up to date
        await refreshUserData();
        
        // Update both users and allUsers states
        setUsers(prev => 
          prev.map(user => 
            user.email === updatedUser.email ? updatedUser : user
          )
        );
        
        setAllUsers(prev => 
          prev.map(user => 
            user.email === updatedUser.email ? updatedUser : user
          )
        );
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
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              <span>{error}</span>
            </div>
            <button
              className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
              onClick={() => setError(null)}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
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
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span>{success}</span>
            </div>
            <button
              className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
              onClick={() => setSuccess(null)}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
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
              {allUsers.filter((user) => user.status === "pending").length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                  {allUsers.filter((user) => user.status === "pending").length}
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
              {allUsers.filter((user) => user.status === "rejected").length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                  {allUsers.filter((user) => user.status === "rejected").length}
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
              {allUsers.filter((user) => user.status === "suspended").length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                  {allUsers.filter((user) => user.status === "suspended").length}
                </span>
              )}
            </button>
          </li>
        </ul>
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
                    <td className="px-6 py-4 space-x-2">
                      {user.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveUser(user.email)}
                            disabled={actionInProgress === user.email}
                            className={`px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg ${
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
                            className={`px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-lg ${
                              actionInProgress === user.email
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-red-700"
                            }`}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {user.status === "active" && (
                        <button
                          onClick={() => handleSuspendUser(user.email)}
                          disabled={actionInProgress === user.email}
                          className={`px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded-lg ${
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
                          className={`px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg ${
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
                      {(user.status === "active" || user.status === "pending") && (
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          Edit
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
                  <span className="sr-only">Close modal</span>
                  ✕
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
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as "user" | "admin"})}
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
    </div>
  );
};

export default AdminUsers;
