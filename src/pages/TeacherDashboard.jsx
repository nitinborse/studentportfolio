import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createStudentNoLogin, fetchStudentsForSchool } from "../services/adminApi";

function slugFromName(name) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function TeacherDashboard() {
  const { profile, logout } = useAuth();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const origin = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    []
  );

  async function loadStudents() {
    if (!profile?.school_id) return;
    setErr("");
    try {
      const list = await fetchStudentsForSchool(profile.school_id);
      setStudents(list);
    } catch (e) {
      setErr(e.message || "Failed to load students.");
    }
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.school_id]);

  async function handleCreateStudent(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);
    try {
      if (!profile?.school_id) throw new Error("Teacher school_id is missing.");
      const res = await createStudentNoLogin({
        full_name: fullName,
        school_id: profile.school_id,
        teacher_id: profile.id,
      });
      setMsg(`Student created. Share URL: ${origin}${res.student_url_path}`);
      setFullName("");
      await loadStudents();
    } catch (e2) {
      setErr(e2.message || "Failed to create student.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ui-page">
      <div className="ui-hero">
        <h2>Teacher Dashboard</h2>
        <p>Create students and manage their portfolio profiles.</p>
        <div className="ui-chip-row">
          <span className="ui-chip">Name: {profile?.full_name || "-"}</span>
          <span className="ui-chip">School: {profile?.school_id || "-"}</span>
          <button className="ui-btn danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="ui-stat-grid">
        <div className="ui-stat">
          <span className="k">Total Students</span>
          <span className="v">{students.length}</span>
        </div>
        <div className="ui-stat">
          <span className="k">School</span>
          <span className="v" style={{ fontSize: 13 }}>{profile?.school_id || "-"}</span>
        </div>
        <div className="ui-stat">
          <span className="k">Profile Editors</span>
          <span className="v">{students.length}</span>
        </div>
      </div>

      <div className="ui-layout two">
        <div className="ui-card">
          <h3>Add Student (No Login)</h3>
          <form onSubmit={handleCreateStudent} className="ui-grid">
            <div className="ui-field">
              <label>Student Full Name</label>
              <input
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <button className="ui-btn primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Student"}
            </button>
          </form>
          {msg && <p className="ui-msg ok">{msg}</p>}
          {err && <p className="ui-msg err">{err}</p>}
        </div>

        <div className="ui-card">
          <h3>Students ({students.length})</h3>
          <p style={{ marginTop: 0, color: "#64748b" }}>
            Click a student name to edit full profile details and theme.
          </p>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Profile URL</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const slug = s.slug || slugFromName(s.full_name);
                  const url = `${origin}/${slug}`;
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link to={`/students/${s.id}/edit`}>{s.full_name}</Link>
                      </td>
                      <td>
                        <a href={url} target="_blank" rel="noreferrer">{url}</a>
                      </td>
                      <td>{s.created_at}</td>
                    </tr>
                  );
                })}
                {!students.length && (
                  <tr>
                    <td colSpan="3">No students found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
