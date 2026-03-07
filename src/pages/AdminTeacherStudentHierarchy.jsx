import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProfilesForSchool, fetchStudentsForHierarchy } from "../services/adminApi";

const PAGE_SIZE = 10;

function pickTeacherKey(rows) {
  const keys = ["teacher_id", "assigned_teacher_id", "created_by_teacher_id", "teacher_uuid"];
  for (const key of keys) {
    if (rows.some((r) => r && Object.prototype.hasOwnProperty.call(r, key))) {
      return key;
    }
  }
  return null;
}

export default function AdminTeacherStudentHierarchy() {
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [adminQuery, setAdminQuery] = useState("");
  const [teacherQuery, setTeacherQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [adminPage, setAdminPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const [profiles, studentRows] = await Promise.all([
          fetchProfilesForSchool(null),
          fetchStudentsForHierarchy(),
        ]);

        if (!alive) return;
        setAdmins((profiles || []).filter((p) => p.role === "admin"));
        setTeachers((profiles || []).filter((p) => p.role === "teacher"));
        setStudents(studentRows || []);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load hierarchy.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const visibleTeachers = useMemo(() => {
    if (!selectedAdmin) return [];
    return teachers.filter((t) => t.school_id === selectedAdmin.school_id);
  }, [teachers, selectedAdmin]);

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

  const filteredAdmins = useMemo(() => {
    const q = adminQuery.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        String(a.full_name || "").toLowerCase().includes(q) ||
        String(a.school_id || "").toLowerCase().includes(q)
    );
  }, [admins, adminQuery]);

  const filteredTeachers = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase();
    if (!q) return visibleTeachers;
    return visibleTeachers.filter(
      (t) =>
        String(t.full_name || "").toLowerCase().includes(q) ||
        String(t.school_id || "").toLowerCase().includes(q)
    );
  }, [visibleTeachers, teacherQuery]);

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

  const adminPages = Math.max(1, Math.ceil(filteredAdmins.length / PAGE_SIZE));
  const teacherPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
  const studentPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));

  const pagedAdmins = useMemo(
    () => filteredAdmins.slice((adminPage - 1) * PAGE_SIZE, adminPage * PAGE_SIZE),
    [filteredAdmins, adminPage]
  );
  const pagedTeachers = useMemo(
    () => filteredTeachers.slice((teacherPage - 1) * PAGE_SIZE, teacherPage * PAGE_SIZE),
    [filteredTeachers, teacherPage]
  );
  const pagedStudents = useMemo(
    () => filteredStudents.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE),
    [filteredStudents, studentPage]
  );

  return (
    <div className="ui-page hierarchy-page">
      <div className="ui-hero">
        <h2>Admin Teacher Student Hierarchy</h2>
        <p>Drill-down view with search and pagination for large datasets.</p>
        <div className="ui-chip-row">
          <Link to="/super-admin" className="ui-chip">Back to Super Admin</Link>
          <span className="ui-chip">Admins: {admins.length}</span>
          <span className="ui-chip">Teachers: {teachers.length}</span>
          <span className="ui-chip">Students: {students.length}</span>
          {/* <span className="ui-chip">Selected Admin: {selectedAdmin?.full_name || "-"}</span>
          <span className="ui-chip">Selected Teacher: {selectedTeacher?.full_name || "-"}</span> */}
        </div>
      </div>

      {loading && (
        <div className="ui-card">
          <p>Loading hierarchy...</p>
        </div>
      )}
      {!!err && (
        <div className="ui-card">
          <p className="ui-msg err">{err}</p>
        </div>
      )}

      <div className="ui-layout three hierarchy-grid">
        <div className="ui-card hierarchy-step">
          <h3>Step 1: Select Admin ({filteredAdmins.length})</h3>
          <div className="ui-field">
            <label>Search Admin</label>
            <input
              value={adminQuery}
              onChange={(e) => {
                setAdminQuery(e.target.value);
                setAdminPage(1);
              }}
              placeholder="Search by admin name or school id"
            />
          </div>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>School ID</th>
                </tr>
              </thead>
              <tbody>
                {pagedAdmins.map((a) => (
                  <tr
                    key={a.id}
                    className={selectedAdmin?.id === a.id ? "hierarchy-row active" : "hierarchy-row"}
                    onClick={() => {
                      setSelectedAdmin(a);
                      setSelectedTeacher(null);
                      setTeacherQuery("");
                      setStudentQuery("");
                      setTeacherPage(1);
                      setStudentPage(1);
                    }}
                  >
                    <td>{a.full_name || "-"}</td>
                    <td>{a.school_id || "-"}</td>
                  </tr>
                ))}
                {!admins.length && (
                  <tr>
                    <td colSpan="2">No admins found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="hierarchy-pager">
            <button className="ui-btn" disabled={adminPage <= 1} onClick={() => setAdminPage((p) => p - 1)}>
              Prev
            </button>
            <span>Page {adminPage} / {adminPages}</span>
            <button className="ui-btn" disabled={adminPage >= adminPages} onClick={() => setAdminPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>

        <div className="ui-card hierarchy-step">
          <h3>Step 2: Select Teacher ({filteredTeachers.length})</h3>
          {!selectedAdmin ? <p>Select an admin first.</p> : null}
          {selectedAdmin ? (
            <>
              <div className="ui-field">
                <label>Search Teacher</label>
                <input
                  value={teacherQuery}
                  onChange={(e) => {
                    setTeacherQuery(e.target.value);
                    setTeacherPage(1);
                  }}
                  placeholder="Search by teacher name or school id"
                />
              </div>
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>School ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTeachers.map((t) => (
                      <tr
                        key={t.id}
                        className={selectedTeacher?.id === t.id ? "hierarchy-row active" : "hierarchy-row"}
                        onClick={() => {
                          setSelectedTeacher(t);
                          setStudentPage(1);
                        }}
                      >
                        <td>{t.full_name || "-"}</td>
                        <td>{t.school_id || "-"}</td>
                      </tr>
                    ))}
                    {!visibleTeachers.length && (
                      <tr>
                        <td colSpan="2">No teachers found for this admin.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="hierarchy-pager">
                <button className="ui-btn" disabled={teacherPage <= 1} onClick={() => setTeacherPage((p) => p - 1)}>
                  Prev
                </button>
                <span>Page {teacherPage} / {teacherPages}</span>
                <button className="ui-btn" disabled={teacherPage >= teacherPages} onClick={() => setTeacherPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </>
          ) : null}
        </div>

        <div className="ui-card hierarchy-step">
          <h3>Step 3: Students ({filteredStudents.length})</h3>
          {!selectedTeacher ? <p>Select a teacher to view students.</p> : null}
          {!!selectedTeacher && (
            <p className="hierarchy-note">
              {teacherKey
                ? `Using "${teacherKey}" for teacher assignment filter.`
                : "No teacher assignment field found; showing students from teacher school id."}
            </p>
          )}
          {selectedTeacher ? (
            <>
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
                    </tr>
                  </thead>
                  <tbody>
                    {pagedStudents.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <Link to={`/students/${s.id}/edit`}>{s.full_name || "-"}</Link>
                        </td>
                        <td>{s.class || "-"}</td>
                        <td>{s.section || "-"}</td>
                      </tr>
                    ))}
                    {!filteredStudents.length && (
                      <tr>
                        <td colSpan="3">No students found for this teacher.</td>
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
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
