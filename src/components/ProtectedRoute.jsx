import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allow = [] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="ui-center">
        <div className="ui-card" style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
          <h3>Loading...</h3>
          <p style={{ color: "#64748b" }}>Preparing your access permissions.</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.role) return <Navigate to="/post-login" replace />;
  if (allow.length && !allow.includes(profile.role)) return <Navigate to="/post-login" replace />;

  return children;
}
