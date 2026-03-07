import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { fetchStudentsForHierarchy } from "../services/adminApi";

import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 12;

function pickTeacherKey(rows) {
  const keys = ["teacher_id", "assigned_teacher_id", "created_by_teacher_id", "teacher_uuid"];
  for (const key of keys) {
    if (rows.some((r) => r && Object.prototype.hasOwnProperty.call(r, key))) {
      return key;
    }
  }
  return null;
}

export default function HierarchyStudentsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get("schoolId") || "";
  const teacherName = searchParams.get("teacherName") || "";
  const adminId = searchParams.get("adminId") || "";
  const adminName = searchParams.get("adminName") || "";

  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const rows = await fetchStudentsForHierarchy();
        if (!alive) return;
        setStudents(rows || []);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load students.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const teacherKey = useMemo(() => pickTeacherKey(students), [students]);

  const scoped = useMemo(() => {
    if (teacherKey) {
      const byTeacher = students.filter((s) => String(s?.[teacherKey] || "") === String(teacherId || ""));
      if (byTeacher.length) return byTeacher;
    }
    return students.filter((s) => String(s?.school_id || "") === String(schoolId || ""));
  }, [students, teacherId, schoolId, teacherKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter(
      (s) =>
        String(s.full_name || "").toLowerCase().includes(q) ||
        String(s.class || "").toLowerCase().includes(q) ||
        String(s.section || "").toLowerCase().includes(q)
    );
  }, [scoped, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const backParams = new URLSearchParams({
    schoolId,
    adminName,
  }).toString();
  const backToTeachers = adminId
    ? `/super-admin/hierarchy/admin/${adminId}/teachers?${backParams}`
    : "/super-admin/hierarchy/admins";

  return (
    <div className="ui-page">
      <div className="ui-hero">
        <h2>Students</h2>
        <p>Teacher: {teacherName || teacherId}</p>
        <div className="ui-chip-row">
          <Link to={backToTeachers} className="ui-chip">
            Back to Teachers
          </Link>
          <span className="ui-chip">School ID: {schoolId || "-"}</span>
          <span className="ui-chip">Total Students: {filtered.length}</span>
          <button className="ui-btn danger" onClick={async () => { await logout(); navigate("/login"); }}>Logout</button>
        </div>
      </div>

      {loading && <div className="ui-card"><p>Loading students...</p></div>}
      {!!err && <div className="ui-card"><p className="ui-msg err">{err}</p></div>}

      <div className="ui-card">
        <div className="ui-field">
          <label>Search Student</label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by student name, class or section"
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
              {paged.map((s) => (
                <tr key={s.id}>
                  <td>{s.full_name || "-"}</td>
                  <td>{s.class || "-"}</td>
                  <td>{s.section || "-"}</td>
                  <td>
                    <Link to={`/students/${s.id}/edit`}>Edit Student</Link>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="4">No students found for this teacher.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="hierarchy-pager">
          <button className="ui-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page} / {pages}</span>
          <button className="ui-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
