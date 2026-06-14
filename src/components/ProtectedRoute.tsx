import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuthorizedStaffUser } from "@/lib/staffAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const access = await getAuthorizedStaffUser();
      setIsAuthorized(Boolean(access.staff));
      setIsLoading(false);
    };

    void checkAccess();
  }, []);

  if (isLoading) {
    return null;
  }

  if (!isAuthorized) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
