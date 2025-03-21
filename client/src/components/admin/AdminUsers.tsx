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
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Load users on component mount and when tab changes
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
        } else {
          console.log("Fetching all users");
          fetchedUsers = await fetchUsers();
        }
        
        console.log("Fetched users:", fetchedUsers);
        
        // Validate the response
        if (!fetchedUsers || !Array.isArray(fetchedUsers)) {
          console.error("Invalid user data received:", fetchedUsers);
          setError("Invalid user data received from server");
          setUsers([]);
          return;
        }

        // Add this helper function to your component
        const determineUserRole = (user: User): "user" | "admin" => {
          // First check if the user belongs to the GRC-Admin group
          if (user.attributes?.['cognito:groups']) {
            try {
              const groups = JSON.parse(user.attributes['cognito:groups']);
              if (Array.isArray(groups) && groups.includes('GRC-Admin')) {
                return "admin";
              }
            } catch {
              // If parsing fails, continue to the fallback
              console.warn('Failed to parse groups from user attributes');
            }
          }
          
          // Then fall back to the custom:role attribute
          return (user.attributes?.["custom:role"] as "user" | "admin") || "user";
        };

        // Transform the API data to match our component's expected format
        const transformedUsers: UserData[] = fetchedUsers.map((user) => {
          console.log("Processing user:", user);
          if (!user || !user.email) {
            console.warn("Invalid user object in response:", user);
            return null;
          }
          
          return {
            email: user.attributes?.email || user.email,
            status: getUserStatus(user.status, user.enabled, user.customStatus),
            role: determineUserRole(user),
            created: user.created,
            lastLogin: user.lastModified,
            enabled: user.enabled,
            customStatus: user.customStatus,
          };
        }).filter(Boolean) as UserData[]; // Remove any null entries
        
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
        
        // Update local state to ensure immediate UI update
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
        
        // Update local state to ensure immediate UI update
        setUsers((prev) =>
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

        // Update the user in the list
        setUsers((prevUsers) =>
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

        // Update the user in the list
        setUsers((prevUsers) =>
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

  // Filter users based on the active tab
  const filteredUsers =
    activeTab === "all"
      ? users
      : users.filter((user) => user.status === "pending");

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
        
        // Update local state
        setUsers(prev => 
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
          className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300"
          role="alert"
        >
          {error}
          <button
            className="float-right font-bold"
            onClick={() => setError(null)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

      {success && (
        <div
          className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300"
          role="alert"
        >
          {success}
          <button
            className="float-right font-bold"
            onClick={() => setSuccess(null)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

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
              All Users
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === "pending"
                  ? "border-primary-600 text-primary-600 dark:text-primary-500 dark:border-primary-500"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              }`}
            >
              Pending Approval
              {users.filter((user) => user.status === "pending").length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                  {users.filter((user) => user.status === "pending").length}
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
                {filteredUsers.map((user) => (
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

          {filteredUsers.length === 0 && (
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
