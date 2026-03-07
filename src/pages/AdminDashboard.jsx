import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createUser, fetchProfilesForSchool, fetchStudentsForSchool } from "../services/adminApi";

const PAGE_SIZE = 10;

function pickTeacherKey(rows) {
  const keys = ["teacher_id", "assigned_teacher_id", "created_by_teacher_id", "teacher_uuid"];
  for (const key of keys) {
    if (rows.some((r) => r && Object.prototype.hasOwnProperty.call(r, key))) return key;
  }
  return null;
}

export default function AdminDashboard() {
  const { profile, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrs, setFieldErrs] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherQuery, setTeacherQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [teacherPage, setTeacherPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);

  const teacherKey = useMemo(() => pickTeacherKey(students), [students]);

  const teacherScopedStudents = useMemo(() => {
    if (!selectedTeacher) return [];
    if (teacherKey) {
      const filtered = students.filter(
        (s) => String(s?.[teacherKey] || "") === String(selectedTeacher.id || "")
      );
      if (filtered.length) return filtered;
    }
    return students.filter((s) => s.school_id === selectedTeacher.school_id);
  }, [students, selectedTeacher, teacherKey]);

  const filteredTeachers = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        String(t.full_name || "").toLowerCase().includes(q) ||
        String(t.school_id || "").toLowerCase().includes(q)
    );
  }, [teachers, teacherQuery]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return teacherScopedStudents;
    return teacherScopedStudents.filter(
      (s) =>
        String(s.full_name || "").toLowerCase().includes(q) ||
        String(s.class || "").toLowerCase().includes(q) ||
        String(s.section || "").toLowerCase().includes(q)
    );
  }, [teacherScopedStudents, studentQuery]);

  const teacherPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
  const studentPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));

  const pagedTeachers = useMemo(
    () => filteredTeachers.slice((teacherPage - 1) * PAGE_SIZE, teacherPage * PAGE_SIZE),
    [filteredTeachers, teacherPage]
  );
  const pagedStudents = useMemo(
    () => filteredStudents.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE),
    [filteredStudents, studentPage]
  );

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  async function loadSchoolUsers() {
    if (!profile?.school_id) return;
    try {
      const [profiles, studentRows] = await Promise.all([
        fetchProfilesForSchool(profile.school_id),
        fetchStudentsForSchool(profile.school_id),
      ]);
      setTeachers((profiles || []).filter((p) => p.role === "teacher"));
      setStudents(studentRows || []);
    } catch (e) {
      setErr(e.message || "Failed to load school users.");
    }
  }

  useEffect(() => {
    loadSchoolUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.school_id]);

  function validateForm() {
    const next = {};

    if (!fullName.trim()) {
      next.fullName = "Full name is required.";
    } else if (fullName.trim().length < 3) {
      next.fullName = "Full name must be at least 3 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      next.password = "Password must include letters and numbers.";
    }

    setFieldErrs(next);
    return Object.keys(next).length === 0;
  }

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (!profile?.school_id) throw new Error("Admin has no school_id set in profile.");

      const res = await createUser({
        email,
        password,
        full_name: fullName,
        role: "teacher",
        school_id: profile.school_id,
      });

      setMsg(`Teacher created OK. ID: ${res?.id}`);
      setEmail("");
      setPassword("");
      setFullName("");
      setFieldErrs({});
      await loadSchoolUsers();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page">
      <div className="ui-hero">
        <h2>Admin Dashboard</h2>
        <p>Manage teachers and students for your school from one place.</p>
        <div className="ui-chip-row">
          <span className="ui-chip">School Name: {profile?.full_name || "-"}</span>
          <span className="ui-chip">School ID: {profile?.school_id || "-"}</span>
          <Link to="/admin/hierarchy" className="ui-chip">Hierarchy View</Link>
          <button className="ui-btn danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="ui-stat-grid">
        <div className="ui-stat">
          <span className="k">Role</span>
          <span className="v" style={{ fontSize: 16 }}>Admin</span>
        </div>
        <div className="ui-stat">
          <span className="k">Teachers</span>
          <span className="v">{teachers.length}</span>
        </div>
        <div className="ui-stat">
          <span className="k">Students</span>
          <span className="v">{students.length}</span>
        </div>
      </div>

      <div className="ui-layout" style={{ marginTop: 14 }}>
        <div className="ui-card">
          <h3>Add Teacher</h3>
          <form onSubmit={handleCreateTeacher} className="ui-grid">
            <div className="ui-field">
              <label>Full Name</label>
              <input
                placeholder="Teacher name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrs.fullName) setFieldErrs((prev) => ({ ...prev, fullName: "" }));
                }}
              />
              {!!fieldErrs.fullName && <p className="ui-msg err">{fieldErrs.fullName}</p>}
            </div>
            <div className="ui-field">
              <label>Email</label>
              <input
                placeholder="teacher@school.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrs.email) setFieldErrs((prev) => ({ ...prev, email: "" }));
                }}
              />
              {!!fieldErrs.email && <p className="ui-msg err">{fieldErrs.email}</p>}
            </div>
            <div className="ui-field">
              <label>Password</label>
              <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrs.password) setFieldErrs((prev) => ({ ...prev, password: "" }));
                }}
              />
              {!!fieldErrs.password && <p className="ui-msg err">{fieldErrs.password}</p>}
            </div>
            <button className="ui-btn primary" type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Teacher"}
            </button>
            {msg && <p className="ui-msg ok">{msg}</p>}
            {err && <p className="ui-msg err">{err}</p>}
          </form>
        </div>
      </div>

      <div className="ui-layout two">
        <div className="ui-card">
          <h3>Teachers ({teachers.length})</h3>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>School ID</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td>{t.full_name || "-"}</td>
                    <td>{t.id}</td>
                    <td>{t.created_at || "-"}</td>
                  </tr>
                ))}
                {!teachers.length && (
                  <tr>
                    <td colSpan="3">No teachers found for this school.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ui-card">
          <h3>Students ({students.length})</h3>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const portfolioPath = s.slug ? `/${s.slug}` : "";
                  const portfolioUrl = portfolioPath ? `${origin}${portfolioPath}` : "";

                  return (
                    <tr key={s.id}>
                      <td>
                        <Link to={`/students/${s.id}/edit`} className="ui-link">
                          {s.full_name || "-"}
                        </Link>
                      </td>
                      <td>{s.class || "-"}</td>
                      <td>{s.section || "-"}</td>
                      <td>
                        {portfolioUrl ? (
                          <a href={portfolioUrl} target="_blank" rel="noreferrer" className="ui-link">
                            Open Portfolio
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!students.length && (
                  <tr>
                    <td colSpan="4">No students found for this school.</td>
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
