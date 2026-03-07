import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProfilesForSchool } from "../services/adminApi";

const PAGE_SIZE = 12;

export default function HierarchyAdminsPage() {
  const [admins, setAdmins] = useState([]);
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
        const profiles = await fetchProfilesForSchool(null);
        if (!alive) return;
        setAdmins((profiles || []).filter((p) => p.role === "admin"));
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load admins.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        String(a.full_name || "").toLowerCase().includes(q) ||
        String(a.school_id || "").toLowerCase().includes(q)
    );
  }, [admins, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  return (
    <div className="ui-page">
      <div className="ui-hero">
        <h2>Admins</h2>
        <p>Select an admin to view teachers under that admin.</p>
        <div className="ui-chip-row">
          <Link to="/super-admin" className="ui-btn">Back to Super Admin</Link>
          <span className="ui-chip">Total Admins: {filtered.length}</span>
        </div>
      </div>

      {loading && <div className="ui-card"><p>Loading admins...</p></div>}
      {!!err && <div className="ui-card"><p className="ui-msg err">{err}</p></div>}

      <div className="ui-card">
        <div className="ui-field">
          <label>Search Admin</label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((a) => {
                const params = new URLSearchParams({
                  schoolId: a.school_id || "",
                  adminName: a.full_name || "",
                });
                return (
                  <tr key={a.id}>
                    <td>{a.full_name || "-"}</td>
                    <td>{a.school_id || "-"}</td>
                    <td>
                      <Link to={`/super-admin/hierarchy/admin/${a.id}/teachers?${params.toString()}`}>
                        View Teachers
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan="3">No admins found.</td>
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
