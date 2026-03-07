import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PostLogin() {
  const { loading, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Keep waiting while profile is still being resolved after auth/session events.
    if (!profile) {
      return;
    }

    if (!profile.role) {
      navigate("/login", { replace: true });
      return;
    }

    if (profile.role === "super_admin") navigate("/super-admin", { replace: true });
    else if (profile.role === "admin") navigate("/admin", { replace: true });
    else if (profile.role === "teacher") navigate("/teacher", { replace: true });
    else if (profile.role === "student") navigate("/student", { replace: true });
    else navigate("/login", { replace: true });
  }, [loading, user, profile, navigate]);

  return (
    <div className="ui-center">
      <div className="ui-card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <h3>Checking session...</h3>
        <p style={{ color: "#64748b" }}>Routing you to your dashboard.</p>
      </div>
    </div>
  );
}
