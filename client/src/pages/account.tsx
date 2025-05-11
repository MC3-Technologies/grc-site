import { StrictMode, useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";

import "../index.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";
import { getCurrentUser } from "../amplify/auth";
import { getClientSchema } from "../amplify/schema";
import { redirectToSignIn } from "../utils/routing";


export const AccountPage = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
    lastStatusChange?: string;
    lastStatusChangeBy?: string;
    status?: string;
    role?: string;
    source?: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forceRenderKey, setForceRenderKey] = useState(0);

  const setEmptyProfile = useCallback((email: string) => {
    const empty = { email, firstName: "", lastName: "", companyName: "", source: "setEmptyProfile" };
    setUser(empty);
    setFormData({ firstName: "", lastName: "", companyName: "" });
    localStorage.setItem('userProfile', JSON.stringify(empty));
    setForceRenderKey(prev => prev + 1);
  }, []);

  const loadProfileFromLocalStorage = useCallback((emailIfKnown: string | null, forceEmptyOnLSFail = false) => {
    try {
      const cachedProfileString = localStorage.getItem('userProfile');
      if (cachedProfileString) {
        const cachedProfile = JSON.parse(cachedProfileString);
        if (emailIfKnown && cachedProfile.email !== emailIfKnown) {
          if (forceEmptyOnLSFail && emailIfKnown) setEmptyProfile(emailIfKnown);
          return;
        }
        setUser({ ...cachedProfile, source: "loadProfileFromLocalStorage" });
        setFormData({
          firstName: cachedProfile.firstName || "",
          lastName: cachedProfile.lastName || "",
          companyName: cachedProfile.companyName || "",
        });
        setForceRenderKey(prev => prev + 1);
        return;
      }
      if (forceEmptyOnLSFail && emailIfKnown) setEmptyProfile(emailIfKnown);
    } catch {
      if (forceEmptyOnLSFail && emailIfKnown) setEmptyProfile(emailIfKnown);
    }
  }, [setEmptyProfile]);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.email) { 
        redirectToSignIn(); 
        return; 
      }
      
      const client = getClientSchema();
      const userProfileResponse = await client.queries.getUserProfile({ email: currentUser.email });
      
      if (userProfileResponse.data) {
        try {
          let profileData;
          
          // Handle double-stringified JSON from DynamoDB
          if (typeof userProfileResponse.data === 'string') {
            const firstParse = JSON.parse(userProfileResponse.data);
            
            // Check if firstParse is also a string (double-stringified)
            if (typeof firstParse === 'string') {
              // Parse it again to get the actual object
              profileData = JSON.parse(firstParse);
            } else {
              // firstParse was already an object
              profileData = firstParse;
            }
          } else if (typeof userProfileResponse.data === 'object') {
            profileData = userProfileResponse.data;
          }
          
          if (!profileData) throw new Error("Could not parse profile data from DDB");
          
          // Create user object with valid data
          const newUserData = {
            email: currentUser.email,
            firstName: profileData.firstName || "",
            lastName: profileData.lastName || "",
            companyName: profileData.companyName || "",
            lastStatusChange: profileData.lastStatusChange,
            lastStatusChangeBy: profileData.lastStatusChangeBy,
            status: profileData.status,
            role: profileData.role,
            source: "fetchUserData_DDB"
          };
          
          setUser(newUserData);
          setFormData({
            firstName: newUserData.firstName,
            lastName: newUserData.lastName,
            companyName: newUserData.companyName
          });
          
          // Save to localStorage WITHOUT the source property
          const storageData = {
            email: newUserData.email,
            firstName: newUserData.firstName,
            lastName: newUserData.lastName,
            companyName: newUserData.companyName,
            lastStatusChange: newUserData.lastStatusChange,
            lastStatusChangeBy: newUserData.lastStatusChangeBy,
            status: newUserData.status,
            role: newUserData.role,
          };
          localStorage.setItem('userProfile', JSON.stringify(storageData));
          
          setForceRenderKey(prev => prev + 1);
        } catch {
          setError("Error processing profile data. Try refreshing.");
        }
      } else {
        loadProfileFromLocalStorage(currentUser.email, true);
      }
    } catch {
      const authUser = await getCurrentUser();
      if (authUser?.email) loadProfileFromLocalStorage(authUser.email);
    } finally {
      setLoading(false);
    }
  }, [loadProfileFromLocalStorage]);

  // Initial useEffect for auth check and first data load
  useEffect(() => {
    initFlowbite();
    
    const initialLoad = async () => {
      setLoading(true);
      try {
        const authUser = await getCurrentUser();
        if (!authUser || !authUser.email) {
          redirectToSignIn();
          return;
        }
        loadProfileFromLocalStorage(authUser.email);
        await fetchUserData();
      } catch {
        setError("Authentication error. Please sign in again.");
        redirectToSignIn();
      }
    };
    initialLoad();
  }, [fetchUserData, loadProfileFromLocalStorage]);
  
  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Auto-dismiss error message
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Component mount log (now empty but kept structure)
  useEffect(() => {
    // Left empty - previously had logging
  }, []);
  
  // useEffect for initial component mount: Load from localStorage
  useEffect(() => {
    // Only attempt to load from localStorage if user is uninitialized
    if (!user || (user && user.email && !user.firstName)) {
      try {
        const cachedProfileString = localStorage.getItem('userProfile');
        if (cachedProfileString) {
          const cachedProfile = JSON.parse(cachedProfileString);
          if (cachedProfile.email) { 
            setUser({ ...cachedProfile, source: "mount_localStorage" });
            setFormData({
              firstName: cachedProfile.firstName || "",
              lastName: cachedProfile.lastName || "",
              companyName: cachedProfile.companyName || "",
            });
            setForceRenderKey(prev => prev + 1);
          }
        }
      } catch {
        // Silent error handling for localStorage
      }
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleEditToggle = () => {
    // If canceling, reset form data to original user data
    if (isEditing && user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) {
      setError("Cannot save profile. User information is missing.");
      return;
    }

    setIsSaving(true); 
    setError(null); 
    setSuccess(null);

    const optimisticUpdatedUser = {
      ...user,
      email: user.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      companyName: formData.companyName,
    };

    // Optimistic UI update
    setUser({ ...optimisticUpdatedUser, source: "handleSubmit_optimistic" });
    localStorage.setItem('userProfile', JSON.stringify(optimisticUpdatedUser));
    setForceRenderKey(prev => prev + 1);

    try {
      const client = getClientSchema();
      const response = await client.mutations.updateUserProfile({
        email: user.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        adminEmail: user.email
      });

      if (response.data) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        
        // Trigger a delayed fetch to ensure eventual consistency
        setTimeout(() => {
          fetchUserData();
        }, 1500);
      } else {
        setError("Failed to save profile to database. Please try again.");
      }
    } catch {
      setError("An error occurred while saving your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Removed most debugging logs here
  
  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900" key={forceRenderKey}>
        <div className="py-8 px-4 mx-auto max-w-2xl lg:py-16">
          <h1 className="mb-4 text-3xl font-extrabold leading-none tracking-tight text-gray-900 md:text-4xl dark:text-white">
            My Account
          </h1>
          
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner />
            </div>
          ) : user ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              {/* Success Message */}
              {success && (
                <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
                  <span className="font-medium">Success!</span> {success}
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                  <span className="font-medium">Error!</span> {error}
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    isEditing
                      ? "text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600"
                      : "text-white bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700"
                  }`}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>
              
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 mb-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={user.email}
                        disabled
                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="companyName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    >
                      {isSaving ? (
                        <>
                          <svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                          </svg>
                          Saving...
                        </>
                      ) : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-base text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</p>
                    <p className="text-base text-gray-900 dark:text-white">
                      {user.firstName && user.firstName.trim() !== "" ? user.firstName : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</p>
                    <p className="text-base text-gray-900 dark:text-white">
                      {user.lastName && user.lastName.trim() !== "" ? user.lastName : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</p>
                    <p className="text-base text-gray-900 dark:text-white">
                      {user.companyName && user.companyName.trim() !== "" ? user.companyName : "Not provided"}
                    </p>
                  </div>
                </div>
              )}
              
              <hr className="my-6 border-gray-200 dark:border-gray-700" />
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Account Security</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Manage your password and account security settings.
                </p>
                <a 
                  href="/auth/?mode=change-password" 
                  className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                >
                  Change Password
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                Failed to load user information. Please try refreshing the page.
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
};

// Only run this if file is loaded directly (not imported)
if (document.getElementById('root')) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AccountPage />
    </StrictMode>
  );
} 