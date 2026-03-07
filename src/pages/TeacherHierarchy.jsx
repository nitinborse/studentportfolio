import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchStudentsForSchool } from "../services/adminApi";

const PAGE_SIZE = 10;

function pickTeacherKey(rows) {
  const keys = ["teacher_id", "assigned_teacher_id", "created_by_teacher_id", "teacher_uuid"];
  for (const key of keys) {
    if (rows.some((r) => r && Object.prototype.hasOwnProperty.call(r, key))) return key;
  }
  return null;
}

export default function TeacherHierarchy() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const studentRows = await fetchStudentsForSchool(profile?.school_id || null);
        if (!alive) return;
        setStudents(studentRows || []);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load students.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teacherKey = useMemo(() => pickTeacherKey(students), [students]);

  const teacherScopedStudents = useMemo(() => {
    if (teacherKey) {
      const filtered = students.filter(
        (s) => String(s?.[teacherKey] || "") === String(profile?.id || "")
      );
      if (filtered.length) return filtered;
    }
    return students.filter((s) => s.school_id === profile?.school_id);
  }, [students, profile?.id, profile?.school_id, teacherKey]);

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

  const studentPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));

  const pagedStudents = useMemo(
    () => filteredStudents.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE),
    [filteredStudents, studentPage]
  );

  return (
    <div className="ui-page hierarchy-page">
      <div className="ui-hero">
        <h2>My Students</h2>
        <p>View and manage all students assigned to you.</p>
        <div className="ui-chip-row">
          <Link to="/teacher" className="ui-btn">Back to Teacher Dashboard</Link>
          <span className="ui-chip">Total Students: {filteredStudents.length}</span>
          <button className="ui-btn danger" onClick={async () => { await logout(); navigate("/login"); }}>Logout</button>
        </div>
      </div>

      {loading && <div className="ui-card"><p>Loading students...</p></div>}
      {!!err && <div className="ui-card"><p className="ui-msg err">{err}</p></div>}

      <div className="ui-card">
        {teacherKey && (
          <p className="hierarchy-note">
            Using "{teacherKey}" for teacher assignment filter.
          </p>
        )}
        <div className="ui-field">
          <label>Search Student</label>
          <input
            value={studentQuery}
            onChange={(e) => {
              setStudentQuery(e.target.value);
              setStudentPage(1);
            }}
            placeholder="Search by student name, class, section"
          />
        </div>
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedStudents.map((s) => (
                <tr key={s.id}>
                  <td>{s.full_name || "-"}</td>
                  <td>{s.class || "-"}</td>
                  <td>{s.section || "-"}</td>
                  <td>
                    <Link to={`/students/${s.id}/edit`} className="ui-btn">Edit</Link>
                  </td>
                </tr>
              ))}
              {!filteredStudents.length && (
                <tr>
                  <td colSpan="4">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="hierarchy-pager">
          <button className="ui-btn" disabled={studentPage <= 1} onClick={() => setStudentPage((p) => p - 1)}>
            Prev
          </button>
          <span>Page {studentPage} / {studentPages}</span>
          <button className="ui-btn" disabled={studentPage >= studentPages} onClick={() => setStudentPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
