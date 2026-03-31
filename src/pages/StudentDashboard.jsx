import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { profile, logout } = useAuth();
  const studentName = profile?.full_name || "Student";
  const school = profile?.school_id || "-";
  const role = profile?.role || "student";

  return (
    <div className="ui-page">
      <div className="ui-hero">
        <h2>Student Dashboard</h2>
        <p>Welcome back, {studentName}. Keep your profile updated and portfolio-ready.</p>
        <div className="ui-chip-row">
          <span className="ui-chip">Name: {studentName}</span>
          <span className="ui-chip">Role: {role}</span>
          <span className="ui-chip">School: {school}</span>
          <button className="ui-btn danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="ui-stat-grid">
        <div className="ui-stat">
          <span className="k">Profile</span>
          <span className="v" style={{ fontSize: 16 }}>Active</span>
        </div>
        <div className="ui-stat">
          <span className="k">Role</span>
          <span className="v" style={{ fontSize: 16 }}>{role}</span>
        </div>
        <div className="ui-stat">
          <span className="k">School</span>
          <span className="v" style={{ fontSize: 16 }}>{school}</span>
        </div>
      </div>

      <div className="ui-layout two">
        <div className="ui-card">
          <h3>Your Overview</h3>
          <p style={{ marginTop: 0, color: "#64748b" }}>
            This section confirms your current profile identity in the system.
          </p>
          <div className="ui-grid">
            <div><strong>Name:</strong> {studentName}</div>
            <div><strong>Role:</strong> {role}</div>
            <div><strong>School ID:</strong> {school}</div>
          </div>
        </div>

        <div className="ui-card">
          <h3>Next Steps</h3>
          <p style={{ marginTop: 0, color: "#64748b" }}>
            Ask your teacher/admin to keep your portfolio details, media, and achievements updated.
          </p>
          <div className="ui-grid">
            <span className="ui-chip">Profile Photo</span>
            <span className="ui-chip">Skills</span>
            <span className="ui-chip">Certificates</span>
            <span className="ui-chip">Results</span>
          </div>
        </div>
      </div>
    </div>
  );
}
