import { useState } from "react";

// Placeholder until we implement the actual user management
interface UserData {
  id: string;
  email: string;
  status: "active" | "pending" | "suspended";
  role: "user" | "admin";
  created: string;
  lastLogin: string;
}

// Mock data for initial UI development
const mockUsers: UserData[] = [
  {
    id: "1",
    email: "user1@example.com",
    status: "active",
    role: "user",
    created: "2023-03-10T08:45:23Z",
    lastLogin: "2023-05-24T14:32:11Z",
  },
  {
    id: "2",
    email: "admin@example.com",
    status: "active",
    role: "admin",
    created: "2023-01-05T11:22:33Z",
    lastLogin: "2023-05-24T09:15:42Z",
  },
  {
    id: "3",
    email: "newuser@example.com",
    status: "pending",
    role: "user",
    created: "2023-05-23T16:08:59Z",
    lastLogin: "",
  },
  {
    id: "4",
    email: "suspended@example.com",
    status: "suspended",
    role: "user",
    created: "2023-02-15T13:24:57Z",
    lastLogin: "2023-04-01T10:45:33Z",
  },
];

const AdminUsers = () => {
  const [users] = useState<UserData[]>(mockUsers);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  
  // Filter users based on the active tab
  const filteredUsers = activeTab === "all" 
    ? users 
    : users.filter(user => user.status === "pending");

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
        badgeClasses += "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        break;
      case "pending":
        badgeClasses += "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        break;
      case "suspended":
        badgeClasses += "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
        break;
    }
    
    return (
      <span className={badgeClasses}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
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
              {users.filter(user => user.status === "pending").length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                  {users.filter(user => user.status === "pending").length}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Created</th>
              <th scope="col" className="px-6 py-3">Last Login</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {user.email}
                </th>
                <td className="px-6 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-6 py-4 capitalize">{user.role}</td>
                <td className="px-6 py-4">{formatDate(user.created)}</td>
                <td className="px-6 py-4">{formatDate(user.lastLogin)}</td>
                <td className="px-6 py-4 space-x-2">
                  {user.status === "pending" && (
                    <button 
                      className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                  )}
                  
                  {user.status === "active" && (
                    <button 
                      className="px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
                    >
                      Suspend
                    </button>
                  )}
                  
                  {user.status === "suspended" && (
                    <button 
                      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Reactivate
                    </button>
                  )}
                  
                  <button 
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
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
      
      <div className="mt-8 text-center p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Note: This is a placeholder UI with mock data. In the future milestones, we'll implement:
        </p>
        <ul className="mt-2 text-sm text-left list-disc list-inside text-gray-500 dark:text-gray-400">
          <li>User fetching from Cognito</li>
          <li>User approval workflow</li>
          <li>User editing and role management</li>
          <li>User suspension and deletion</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminUsers;