import { ReactNode, useEffect, useState } from "react";
import { isCurrentUserAdmin, isLoggedIn, isCurrentUserApproved } from "../../amplify/auth";
import { redirectToSignIn } from "../../utils/routing";
import Spinner from "../Spinner";

interface AdminProtectedProps {
  children: ReactNode;
}

const AdminProtected = ({ children }: AdminProtectedProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // First check if user is logged in
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
          redirectToSignIn();
          return;
        }

        // Check if the user is approved
        const approved = await isCurrentUserApproved();
        if (!approved) {
          alert("Your account is not approved. Please wait for admin approval.");
          redirectToSignIn();
          return;
        }

        // Then check if user is an admin
        const admin = await isCurrentUserAdmin();
        if (!admin) {
          // Redirect non-admins to home page
          window.location.href = "/";
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error checking admin access:", error);
        redirectToSignIn();
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};

export default AdminProtected;
