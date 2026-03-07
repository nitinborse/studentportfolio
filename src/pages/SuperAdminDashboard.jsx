import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createUser, fetchProfilesForSchool, fetchStudentsForSchool } from "../services/adminApi";

export default function SuperAdminDashboard() {
  const { profile, logout } = useAuth();

  const [createSchoolId, setCreateSchoolId] = useState("");
  const [listSchoolId, setListSchoolId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [rows, setRows] = useState([]);
  const [studentRows, setStudentRows] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadList() {
    setErr("");
    try {
      const [profileList, studentsList] = await Promise.all([
        fetchProfilesForSchool(listSchoolId || null),
        fetchStudentsForSchool(listSchoolId || null),
      ]);
      setRows(profileList);
      setStudentRows(studentsList);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listSchoolId]);

  const adminRows = rows.filter((r) => r.role === "admin");
  const teacherRows = rows.filter((r) => r.role === "teacher");
  const selectedSchoolId = selectedAdmin?.school_id || "";
  const visibleTeachers = selectedSchoolId
    ? teacherRows.filter((r) => r.school_id === selectedSchoolId)
    : teacherRows;
  const visibleStudents = selectedSchoolId
    ? studentRows.filter((r) => r.school_id === selectedSchoolId)
    : studentRows;

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);

    try {
      const res = await createUser({
        email,
        password,
        full_name: fullName,
        role: "admin",
        school_id: createSchoolId || null,
      });

      setMsg(`User created OK. ID: ${res?.id}`);
      setEmail("");
      setPassword("");
      setFullName("");
      await loadList();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page">
      <div className="ui-hero">
        <h2>Super Admin Dashboard</h2>
        <p>Create staff accounts and manage all schools, teachers, and students.</p>
        <div className="ui-chip-row">
          {/* <Link to="/super-admin" className="ui-chip">Back to Super Admin</Link> */}
          <span className="ui-chip">Admins: {adminRows.length}</span>
          <span className="ui-chip">Teachers: {visibleTeachers.length}</span>
          <span className="ui-chip">Students: {visibleStudents.length}</span>
          <Link to="/super-admin/hierarchy/admins" className="ui-chip">Hierarchy View</Link>
          <button className="ui-btn danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="ui-layout two">
        <div className="ui-card">
          <h3>Add School</h3>
          <form onSubmit={handleCreate} className="ui-grid">
            <div className="ui-field">
              <label>School UUID</label>
              <input
                placeholder="Optional for admin"
                value={createSchoolId}
                onChange={(e) => setCreateSchoolId(e.target.value)}
              />
            </div>
            <div className="ui-field">
              <label>School Name</label>
              <input placeholder="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="ui-field">
              <label>Email</label>
              <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="ui-field">
              <label>Password</label>
              <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="ui-btn primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Admin"}
            </button>
            {msg && <p className="ui-msg ok">{msg}</p>}
            {err && <p className="ui-msg err">{err}</p>}
          </form>
        </div>

        <div className="ui-card">
          <h3>Filters</h3>
          <div className="ui-grid">
            <div className="ui-field">
              <label>Filter by School UUID</label>
              <input
                placeholder="Optional"
                value={listSchoolId}
                onChange={(e) => setListSchoolId(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ui-btn" type="button" onClick={() => setListSchoolId("")}>
                Clear Filter
              </button>
              {!!selectedAdmin && (
                <button className="ui-btn" type="button" onClick={() => setSelectedAdmin(null)}>
                  Reset Admin Focus
                </button>
              )}
            </div>
            <p style={{ margin: 0, color: "#64748b" }}>
              {selectedAdmin
                ? `Focused on ${selectedAdmin.full_name} (${selectedSchoolId || "no school"})`
                : "Viewing all schools."}
            </p>
          </div>
        </div>
      </div>

      <div className="ui-stat-grid">
        <div className="ui-stat">
          <span className="k">Admins</span>
          <span className="v">{adminRows.length}</span>
        </div>
        <div className="ui-stat">
          <span className="k">Teachers</span>
          <span className="v">{visibleTeachers.length}</span>
        </div>
        <div className="ui-stat">
          <span className="k">Students</span>
          <span className="v">{visibleStudents.length}</span>
        </div>
      </div>

      <div className="ui-layout">
        <div className="ui-card">
          <h4>Admins ({adminRows.length})</h4>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>School ID</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {adminRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.full_name}</td>
                    <td>{r.school_id || "-"}</td>
                    <td>{r.created_at}</td>
                    <td>
                      <button className="ui-btn" type="button" onClick={() => setSelectedAdmin(r)}>
                        View Teachers
                      </button>
                    </td>
                  </tr>
                ))}
                {!adminRows.length && (
                  <tr>
                    <td colSpan="4">No admins found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ui-card">
          <h4>
            Teachers ({visibleTeachers.length})
            {selectedAdmin ? ` - ${selectedAdmin.full_name}` : ""}
          </h4>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>School ID</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {visibleTeachers.map((r) => (
                  <tr key={r.id}>
                    <td>{r.full_name}</td>
                    <td>{r.school_id || "-"}</td>
                    <td>{r.created_at}</td>
                  </tr>
                ))}
                {!visibleTeachers.length && (
                  <tr>
                    <td colSpan="3">No teachers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ui-card">
          <h4>
            Students ({visibleStudents.length})
            {selectedAdmin ? ` - ${selectedAdmin.full_name}` : ""}
          </h4>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>School ID</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((r) => (
                  <tr key={r.id}>
                    <td><Link to={`/students/${r.id}/edit`}>{r.full_name}</Link></td>
                    <td>{r.school_id || "-"}</td>
                    <td>{r.created_at}</td>
                  </tr>
                ))}
                {!visibleStudents.length && (
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
