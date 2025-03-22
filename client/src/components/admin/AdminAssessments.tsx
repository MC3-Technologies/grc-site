import { useEffect, useState } from "react";
import {
  CompletedAssessment,
  InProgressAssessment,
} from "../../utils/assessment";
import { fetchUsers } from "../../utils/adminUser";
import Spinner from "../Spinner";
import { redirectToInProgressAssessment, redirectToCompletedAssessment } from "../../utils/routing";

// Combined assessment type for the UI
interface AssessmentData {
  id: string;
  name: string;
  owner: string | null;
  ownerEmail?: string | null; // Added for displaying email instead of ID
  status: "in-progress" | "completed";
  progress: number;
  score?: number;
  isCompliant?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// User info for the dropdown
interface UserOption {
  id: string;
  email: string;
}

const AdminAssessments = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "in-progress" | "completed"
  >("all");
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  
  // New state for user filtering
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  // Read the tab from URL and set activeTab accordingly
  useEffect(() => {
    const updateTabFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      
      if (tabParam === 'in-progress') {
        setActiveTab("in-progress");
      } else if (tabParam === 'completed') {
        setActiveTab("completed");
      } else {
        setActiveTab("all");
      }
    };

    // Set initial tab based on URL
    updateTabFromUrl();

    // Listen for URL changes (browser back/forward buttons)
    window.addEventListener('popstate', updateTabFromUrl);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('popstate', updateTabFromUrl);
    };
  }, []);

  // Fetch users and create a mapping of user IDs to emails
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Force refresh user data to ensure we get the latest mapping
        const fetchedUsers = await fetchUsers(true);
        const userMapping: Record<string, string> = {};
        const userOptions: UserOption[] = [];
        
        fetchedUsers.forEach(user => {
          // The ID can be in user.attributes.sub or user.email (which is actually the UUID)
          const userId = user.attributes?.sub || user.email;
          // The actual email is in user.attributes.email or user.email if it's an email
          const userEmail = user.attributes?.email || (user.email.includes('@') ? user.email : null);
          
          if (userId && userEmail) {
            userMapping[userId] = userEmail;
            userOptions.push({ id: userId, email: userEmail });
            console.log(`Mapped ID ${userId} to email ${userEmail}`);
          }
        });
        
        setUserMap(userMapping);
        setUsers(userOptions);
        console.log("User ID to Email mapping created:", userMapping);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    loadUsers();
    
    // Set up periodic refresh of user data every 30 seconds
    const userRefreshInterval = setInterval(loadUsers, 30000);
    
    return () => {
      clearInterval(userRefreshInterval);
    };
  }, []);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        // Fetch both types of assessments
        const inProgressAssessments =
          await InProgressAssessment.fetchAllAssessments();
        const completedAssessments =
          await CompletedAssessment.fetchAllCompletedAssessments();

        // Ensure we have the latest user mapping
        const currentUserMap = {...userMap};
        
        // If user map is empty, try to fetch it again
        if (Object.keys(currentUserMap).length === 0) {
          try {
            const fetchedUsers = await fetchUsers(true);
            fetchedUsers.forEach(user => {
              const userId = user.attributes?.sub || user.email;
              const userEmail = user.attributes?.email || (user.email.includes('@') ? user.email : null);
              if (userId && userEmail) {
                currentUserMap[userId] = userEmail;
              }
            });
          } catch (err) {
            console.error("Error refreshing user map:", err);
          }
        }

        // Helper function to resolve owner email
        const resolveOwnerEmail = (ownerId: string | null): string | null => {
          if (!ownerId) return null;
          
          // If owner ID is already an email, return it
          if (ownerId.includes('@')) return ownerId;
          
          // Look up in our mapping
          if (currentUserMap[ownerId]) return currentUserMap[ownerId];
          
          // If no match, log and return owner ID (better than nothing)
          console.log(`Could not find email for owner ID: ${ownerId}`);
          return ownerId; 
        };

        // Convert to unified format for UI
        const inProgressData: AssessmentData[] = inProgressAssessments.map(
          (assessment) => {
            const ownerEmail = resolveOwnerEmail(assessment.owner);
              
            return {
              id: assessment.id,
              name: assessment.name,
              owner: assessment.owner,
              ownerEmail: ownerEmail,
              status: "in-progress",
              progress: assessment.percentCompleted,
              createdAt: assessment.createdAt,
              updatedAt: assessment.updatedAt,
            };
          }
        );

        const completedData: AssessmentData[] = completedAssessments.map(
          (assessment) => {
            const ownerEmail = resolveOwnerEmail(assessment.owner);
              
            return {
              id: assessment.id,
              name: assessment.name,
              owner: assessment.owner,
              ownerEmail: ownerEmail,
              status: "completed",
              progress: 100,
              score: assessment.complianceScore,
              isCompliant: assessment.isCompliant,
              createdAt: assessment.createdAt,
              updatedAt: assessment.updatedAt,
              completedAt: assessment.completedAt,
            };
          }
        );

        // Combine and sort by most recent first
        setAssessments(
          [...inProgressData, ...completedData].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
        );
      } catch (error) {
        console.error("Error fetching assessments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [userMap]);

  // Filter assessments based on active tab and selected user
  const filteredAssessments = assessments.filter((assessment) => {
    // Filter by tab
    const matchesTab = activeTab === "all" || assessment.status === activeTab;
    
    // Filter by user if one is selected
    const matchesUser = !selectedUser || assessment.owner === selectedUser;
    
    return matchesTab && matchesUser;
  });

  // Get filtered users for dropdown based on search query
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setShowUserDropdown(false);
    setSearchQuery("");
  };

  // Clear user filter
  const clearUserFilter = () => {
    setSelectedUser(null);
    setSearchQuery("");
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle view button click based on assessment status
  const handleViewAssessment = (assessment: AssessmentData) => {
    if (assessment.status === "in-progress") {
      redirectToInProgressAssessment(assessment.id);
    } else {
      redirectToCompletedAssessment(assessment.id);
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
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              onClick={() => {
                setActiveTab("all");
                // Update URL without full page reload
                const url = new URL(window.location.href);
                url.searchParams.delete('tab');
                window.history.pushState({}, '', url);
              }}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === "all"
                  ? "border-primary-600 text-white bg-primary-600 dark:bg-primary-700 dark:text-white dark:border-primary-500"
                  : "border-transparent text-white bg-gray-700 hover:text-black hover:bg-gray-200 hover:border-gray-300 dark:text-gray-100 dark:bg-gray-800 dark:hover:text-white"
              }`}
            >
              All Assessments
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => {
                setActiveTab("in-progress");
                // Update URL without full page reload
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'in-progress');
                window.history.pushState({}, '', url);
              }}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === "in-progress"
                  ? "border-primary-600 text-white bg-primary-600 dark:bg-primary-700 dark:text-white dark:border-primary-500"
                  : "border-transparent text-white bg-gray-700 hover:text-black hover:bg-gray-200 hover:border-gray-300 dark:text-gray-100 dark:bg-gray-800 dark:hover:text-white"
              }`}
            >
              In Progress
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                {assessments.filter((a) => a.status === "in-progress").length}
              </span>
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => {
                setActiveTab("completed");
                // Update URL without full page reload
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'completed');
                window.history.pushState({}, '', url);
              }}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === "completed"
                  ? "border-primary-600 text-white bg-primary-600 dark:bg-primary-700 dark:text-white dark:border-primary-500"
                  : "border-transparent text-white bg-gray-700 hover:text-black hover:bg-gray-200 hover:border-gray-300 dark:text-gray-100 dark:bg-gray-800 dark:hover:text-white"
              }`}
            >
              Completed
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                {assessments.filter((a) => a.status === "completed").length}
              </span>
            </button>
          </li>
        </ul>
      </div>

      {/* User filter dropdown */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative">
          <button 
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700 inline-flex items-center"
            type="button"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
            </svg>
            {selectedUser ? `Filtered by: ${userMap[selectedUser] || "Unknown"}` : "Filter by User"}
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>

          {/* Dropdown menu */}
          {showUserDropdown && (
            <div className="absolute left-0 z-10 mt-2 w-72 bg-white rounded-lg shadow-lg dark:bg-gray-700">
              <div className="p-3">
                <label htmlFor="user-search" className="sr-only">Search users</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    id="user-search" 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" 
                    placeholder="Search users" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <ul className="max-h-60 overflow-y-auto py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdown-button">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <li key={user.id}>
                      <button 
                        type="button" 
                        className="inline-flex w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        onClick={() => handleUserSelect(user.id)}
                      >
                        {user.email}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No users found</li>
                )}
              </ul>
              {users.length > 0 && (
                <div className="py-2 px-3 border-t border-gray-200 dark:border-gray-600">
                  <button 
                    onClick={clearUserFilter}
                    className="inline-flex items-center text-xs font-medium text-primary-700 dark:text-primary-500 hover:underline"
                  >
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Show active filter badge */}
        {selectedUser && (
          <div className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
            <span>Filtered by: {userMap[selectedUser]}</span>
            <button 
              onClick={clearUserFilter}
              className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-primary-400 hover:text-primary-900 dark:hover:text-primary-100"
              aria-label="Remove filter"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3 hidden md:table-cell">
                Owner
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3 hidden md:table-cell">
                Progress
              </th>
              <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                Created
              </th>
              <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                {activeTab === "completed" ? "Completed" : "Last Updated"}
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAssessments.map((assessment) => (
              <tr
                key={assessment.id}
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {assessment.name}
                  {/* Mobile summary - only visible on small screens */}
                  <div className="md:hidden mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {assessment.ownerEmail && (
                      <div className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                        </svg>
                        {assessment.ownerEmail}
                      </div>
                    )}
                    <div className="flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                      </svg>
                      {assessment.status === "completed"
                        ? formatDate(assessment.completedAt || "")
                        : formatDate(assessment.updatedAt)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          assessment.status === "completed"
                            ? "bg-green-600"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${assessment.progress}%` }}
                      ></div>
                    </div>
                    <div>{assessment.progress}% complete</div>
                  </div>
                </th>
                <td className="px-6 py-4 hidden md:table-cell">
                  {assessment.ownerEmail || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      assessment.status === "in-progress"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    }`}
                  >
                    {assessment.status === "in-progress"
                      ? "In Progress"
                      : "Completed"}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className={`h-2.5 rounded-full ${
                        assessment.status === "completed"
                          ? "bg-green-600"
                          : "bg-blue-600"
                      }`}
                      style={{ width: `${assessment.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                    {assessment.progress}%
                  </span>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  {formatDate(assessment.createdAt)}
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  {assessment.status === "completed"
                    ? formatDate(assessment.completedAt || "")
                    : formatDate(assessment.updatedAt)}
                </td>
                <td className="px-6 py-4 space-x-2 flex flex-wrap gap-1">
                  <button 
                    onClick={() => handleViewAssessment(assessment)}
                    className="flex items-center px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                    aria-label="View assessment"
                    title="View assessment"
                  >
                    <svg 
                      className="w-3.5 h-3.5 mr-1" 
                      fill="currentColor" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                    </svg>
                    View
                  </button>
                  <button 
                    className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    aria-label="Export assessment"
                    title="Export assessment data"
                  >
                    <svg 
                      className="w-3.5 h-3.5 mr-1" 
                      fill="currentColor" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                    Export
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAssessments.length === 0 && (
        <div className="p-4 mt-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-300">
          No assessments found matching the selected filter.
        </div>
      )}

      <div className="mt-8 text-center p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          In future milestones, we'll implement:
        </p>
        <ul className="mt-2 text-sm text-left list-disc list-inside text-gray-500 dark:text-gray-400">
          <li>Assessment export functionality</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminAssessments;
