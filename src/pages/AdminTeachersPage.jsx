import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchProfilesForSchool } from "../services/adminApi";

const PAGE_SIZE = 12;

export default function AdminTeachersPage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
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
        const profiles = await fetchProfilesForSchool(profile?.school_id || null);
        if (!alive) return;
        setTeachers((profiles || []).filter((p) => p.role === "teacher"));
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load teachers.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        String(t.full_name || "").toLowerCase().includes(q) ||
        String(t.school_id || "").toLowerCase().includes(q)
    );
  }, [teachers, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  return (
    <div className="ui-page">
      <div className="ui-hero">
        <h2>Teachers</h2>
        <p>Select a teacher to view their students.</p>
        <div className="ui-chip-row">
          <Link to="/admin" className="ui-chip">Back to Admin Dashboard</Link>
          <span className="ui-chip">Total Teachers: {filtered.length}</span>
          <button className="ui-btn danger" onClick={async () => { await logout(); navigate("/login"); }}>Logout</button>
        </div>
      </div>

      {loading && <div className="ui-card"><p>Loading teachers...</p></div>}
      {!!err && <div className="ui-card"><p className="ui-msg err">{err}</p></div>}

      <div className="ui-card">
        <div className="ui-field">
          <label>Search Teacher</label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by teacher name"
          />
        </div>

        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>School ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((t) => {
                const params = new URLSearchParams({
                  teacherName: t.full_name || "",
                  schoolId: profile?.school_id || "",
                });
                return (
                  <tr key={t.id}>
                    <td>{t.full_name || "-"}</td>
                    <td>{t.school_id || "-"}</td>
                    <td>
                      <Link to={`/admin/hierarchy/teacher/${t.id}/students?${params.toString()}`}>
                        View Students
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan="3">No teachers found.</td>
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
