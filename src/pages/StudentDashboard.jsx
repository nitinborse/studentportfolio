import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { profile, logout } = useAuth();

  return (
    <div className="ui-page">
      <div className="ui-hero">
        <h2>Student Dashboard</h2>
        <p>Welcome to your student area.</p>
        <div className="ui-chip-row">
          <span className="ui-chip">Name: {profile?.full_name || "-"}</span>
          <span className="ui-chip">Role: {profile?.role || "-"}</span>
          <button className="ui-btn danger" onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
