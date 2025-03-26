import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  isLoggedIn,
  isUserAccountActive,
  getUserAccountStatus,
  isCurrentUserAdmin,
  getCurrentUser,
} from "../amplify/auth";
import Spinner from "./Spinner";
import { Alert } from "./Alert";

interface PrivateRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isLoggedIn();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          // TEMPORARY FIX: Check if this is the admin account
          const user = await getCurrentUser();

          // If this is your admin email, bypass the active check
          if (
            user &&
            (user.email === "cmmc.support@mc3technologies.com" ||
              user.email === "imatar77@hawaii.edu")
          ) {
            setIsActive(true);
            setIsAdmin(true);
            setAccountStatus("CONFIRMED");
          } else {
            const active = await isUserAccountActive();
            setIsActive(active);

            const status = await getUserAccountStatus();
            setAccountStatus(status);

            if (adminOnly) {
              const admin = await isCurrentUserAdmin();
              setIsAdmin(admin);
            }
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [adminOnly]);

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Handle pending/rejected/suspended users
  if (!isActive) {
    let message =
      "Your account requires attention before you can access this page.";

    switch (accountStatus) {
      case "PENDING":
        message =
          "Your account is pending approval. You will be notified via email when your account is approved.";
        break;
      case "REJECTED":
        message =
          "Your account access has been rejected. Please contact an administrator for more information.";
        break;
      case "SUSPENDED":
        message =
          "Your account has been suspended. Please contact an administrator for more information.";
        break;
      case "DISABLED":
        message =
          "Your account has been disabled. Please contact an administrator for more information.";
        break;
    }

    return (
      <div className="container mx-auto p-4 max-w-md">
        <Alert type="error">{message}</Alert>
        <div className="mt-4">
          <button
            onClick={() => (window.location.href = "/signin")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Check if admin access is required but user is not an admin
  if (adminOnly && !isAdmin) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Alert type="error">
          You need administrator privileges to access this page.
        </Alert>
        <div className="mt-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // If we get here, the user is authenticated and active
  return <>{children}</>;
};

export default PrivateRoute;
