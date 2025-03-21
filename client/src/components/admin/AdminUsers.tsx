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
} from "../../utils/adminUser";
import Spinner from "../Spinner";

// Interface to match our component needs
interface UserData {
  email: string;
  status: "active" | "pending" | "suspended";
  role: "user" | "admin";
  created: string;
  lastLogin?: string;
  enabled: boolean;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

        // Transform the API data to match our component's expected format
        const transformedUsers: UserData[] = fetchedUsers.map((user) => {
          console.log("Processing user:", user);
          if (!user || !user.email) {
            console.warn("Invalid user object in response:", user);
            return null;
          }
          
          return {
            email: user.email,
            status: getUserStatus(user.status, user.enabled),
            role: getUserRole(user),
            created: user.created,
            lastLogin: user.lastModified,
            enabled: user.enabled,
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

  // Helper to determine user status from Cognito status and enabled flag
  const getUserStatus = (
    status: string,
    enabled: boolean,
  ): "active" | "pending" | "suspended" => {
    if (!enabled) return "suspended";
    if (status === "FORCE_CHANGE_PASSWORD") return "pending";
    return "active";
  };

  // Helper to determine user role
  const getUserRole = (user: User): "user" | "admin" => {
    // Check if user has custom:role attribute or infer from groups
    const roleAttr = user.attributes?.["custom:role"];
    if (roleAttr === "admin") return "admin";
    return "user";
  };

  // Handle user approval
  const handleApproveUser = async (email: string) => {
    setActionInProgress(email);
    setError(null);
    setSuccess(null);

    try {
      const result = await approveUser(email);
      if (result) {
        setSuccess(`User ${email} has been approved successfully.`);

        // Update the user in the list
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.email === email ? { ...user, status: "active" } : user,
          ),
        );
      } else {
        setError(`Failed to approve user ${email}.`);
      }
    } catch (err) {
      console.error(`Error approving user ${email}:`, err);
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError(`An error occurred: ${String(err)}`);
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
      const result = await rejectUser(email, reason);
      if (result) {
        setSuccess(`User ${email} has been rejected.`);

        // Remove the user from the list or update status
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user.email !== email),
        );
      } else {
        setError(`Failed to reject user ${email}.`);
      }
    } catch (err) {
      console.error(`Error rejecting user ${email}:`, err);
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError(`An error occurred: ${String(err)}`);
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
  const StatusBadge = ({ status }: { status: UserData["status"] }) => {
    let badgeClasses = "px-2 py-1 text-xs font-medium rounded-full ";

    switch (status) {
      case "active":
        badgeClasses +=
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        break;
      case "pending":
        badgeClasses +=
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        break;
      case "suspended":
        badgeClasses +=
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
        break;
    }

    return (
      <span className={badgeClasses}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Filter users based on the active tab
  const filteredUsers =
    activeTab === "all"
      ? users
      : users.filter((user) => user.status === "pending");

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

                      <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                        Edit
                      </button>
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
    </div>
  );
};

export default AdminUsers;
