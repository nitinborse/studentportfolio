import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createUser, createSchool, fetchProfilesForSchool, fetchStudentsForSchool } from "../services/adminApi";
import { supabase } from "../services/supabase";

export default function SuperAdminDashboard() {
  const { profile, logout } = useAuth();

  const [schools, setSchools] = useState([]);
  const [newSchoolName, setNewSchoolName] = useState("");
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
      const [profileList, studentsList, schoolsList] = await Promise.all([
        fetchProfilesForSchool(listSchoolId || null),
        fetchStudentsForSchool(listSchoolId || null, null),
        supabase.from('schools').select('*').order('name')
      ]);
      setRows(profileList);
      setStudentRows(studentsList);
      setSchools(schoolsList.data || []);
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

  function generateUUID() {
    return crypto.randomUUID();
  }

  const handleCreateSchool = async () => {
    if (!newSchoolName.trim()) {
      setErr('School name required');
      return;
    }
    try {
      const school = await createSchool(newSchoolName.trim());
      setSchools([...schools, school]);
      setCreateSchoolId(school.id);
      setNewSchoolName('');
      setMsg(`School created: ${school.name} (${school.id})`);
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    
    if (!createSchoolId?.trim()) {
      setErr("School UUID is required");
      return;
    }
    
    if (!email?.trim()) {
      setErr("Email is required");
      return;
    }
    
    if (!password?.trim()) {
      setErr("Password is required");
      return;
    }
    
    if (!fullName?.trim()) {
      setErr("School Name is required");
      return;
    }
    
    setLoading(true);

    try {
      console.log('Creating user with:', { email, role: 'admin', school_id: createSchoolId, full_name: fullName });
      
      const res = await createUser({
        email,
        password,
        full_name: fullName,
        role: "admin",
        school_id: createSchoolId,
      });

      setMsg(`Admin created successfully! ID: ${res?.user_id}`);
      setEmail("");
      setPassword("");
      setFullName("");
      setCreateSchoolId("");
      await loadList();
    } catch (e2) {
      console.error('Create user error:', e2);
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
          <h3>Create New School</h3>
          <div className="ui-grid">
            <div className="ui-field">
              <label>School Name</label>
              <input
                placeholder="Enter school name"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
              />
            </div>
            <div className="ui-field">
              <label>School UUID (auto-generated)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Click generate"
                  value={createSchoolId}
                  onChange={(e) => setCreateSchoolId(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="ui-btn" type="button" onClick={() => setCreateSchoolId(generateUUID())}>
                  Generate
                </button>
              </div>
            </div>
            <button className="ui-btn" type="button" onClick={handleCreateSchool}>
              Create School
            </button>
            <p style={{ fontSize: 12, color: '#64748b' }}>Note: Save the UUID after creating school</p>
          </div>
        </div>

        <div className="ui-card">
          <h3>Create Admin for School</h3>
          <form onSubmit={handleCreate} className="ui-grid">
            <div className="ui-field">
              <label>School UUID</label>
              <select
                value={createSchoolId}
                onChange={(e) => {
                  const schoolId = e.target.value;
                  setCreateSchoolId(schoolId);
                  const school = schools.find(s => s.id === schoolId);
                  if (school) setFullName(school.name);
                }}
              >
                <option value="">-- Select a school --</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="ui-field">
              <label>School Name</label>
              <input 
                placeholder="Auto-filled from school selection" 
                value={fullName} 
                readOnly
              />
            </div>
            <div className="ui-field">
              <label>Email (Required)</label>
              <input 
                type="email"
                placeholder="admin@school.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="ui-field">
              <label>Password (Required)</label>
              <input 
                placeholder="Min 6 characters" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
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
