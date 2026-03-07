import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;

  const userRole = user?.role; // will fetch from profiles table later
  if (!allowedRoles.includes(userRole)) return <Navigate to="/" />;

  return children;
}