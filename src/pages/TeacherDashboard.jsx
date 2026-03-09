import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createStudentNoLogin, fetchStudentsForSchool, bulkCreateStudents } from "../services/adminApi";

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
  const [bulkLoading, setBulkLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [bulkMsg, setBulkMsg] = useState("");
  const [bulkErr, setBulkErr] = useState("");

  const origin = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    []
  );

  async function loadStudents() {
    if (!profile?.school_id) return;
    setErr("");
    try {
      const list = await fetchStudentsForSchool(profile.school_id, profile.id);
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

  async function handleBulkUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkMsg("");
    setBulkErr("");
    setBulkLoading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error("CSV must have header and at least 1 student");
      
      const header = lines[0].toLowerCase().split(",").map(h => h.trim());
      const getIdx = (col) => header.indexOf(col);
      
      if (getIdx("name") === -1) throw new Error("CSV must have 'name' column");
      
      const students = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const name = cols[getIdx("name")];
        if (!name) continue;
        students.push({
          full_name: name,
          class: getIdx("class") !== -1 ? cols[getIdx("class")] : null,
          section: getIdx("section") !== -1 ? cols[getIdx("section")] : null,
          theme: getIdx("theme") !== -1 ? cols[getIdx("theme")] : null,
          firstName: getIdx("firstname") !== -1 ? cols[getIdx("firstname")] : null,
          middleName: getIdx("middlename") !== -1 ? cols[getIdx("middlename")] : null,
          lastName: getIdx("lastname") !== -1 ? cols[getIdx("lastname")] : null,
          coreSkills: getIdx("coreskills") !== -1 ? cols[getIdx("coreskills")] : null,
          location: getIdx("location") !== -1 ? cols[getIdx("location")] : null,
          homeAddress: getIdx("homeaddress") !== -1 ? cols[getIdx("homeaddress")] : null,
          awards: getIdx("awards") !== -1 ? cols[getIdx("awards")] : null,
          certificates: getIdx("certificates") !== -1 ? cols[getIdx("certificates")] : null,
          mobile: getIdx("mobile") !== -1 ? cols[getIdx("mobile")] : null,
          email: getIdx("email") !== -1 ? cols[getIdx("email")] : null,
          schoolName: getIdx("schoolname") !== -1 ? cols[getIdx("schoolname")] : null,
          testimonials: getIdx("testimonials") !== -1 ? cols[getIdx("testimonials")] : null
        });
      }
      
      if (!students.length) throw new Error("No valid students found in CSV");
      
      const result = await bulkCreateStudents({
        students,
        school_id: profile.school_id,
        teacher_id: profile.id
      });
      
      setBulkMsg(`Successfully created ${result.length} students`);
      await loadStudents();
    } catch (e2) {
      setBulkErr(e2.message || "Bulk upload failed");
    } finally {
      setBulkLoading(false);
      e.target.value = "";
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
          <Link to="/teacher/hierarchy" className="ui-chip">View All Students</Link>
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
          
          <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
          
          <h3>Bulk Upload Students</h3>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "10px" }}>
            Upload CSV with: <strong>name</strong> (required), class, section, theme, firstName, middleName, lastName, coreSkills, location, homeAddress, awards, certificates, mobile, email, schoolName, testimonials
          </p>
          <button 
            className="ui-btn secondary" 
            style={{ marginBottom: "10px", fontSize: "12px", padding: "6px 12px" }}
            onClick={() => {
              const csv = `name,class,section,theme,firstName,middleName,lastName,coreSkills,location,homeAddress,awards,certificates,mobile,email,schoolName,testimonials
Rahul Sharma,10th,A,Robotics,Rahul,,Sharma,Python;JavaScript;AI,Mumbai,123 MG Road,Robotics Winner;Science Fair Gold,Python Cert;AI Workshop,9876543210,rahul@email.com,DPS School,Great student;Active participant`;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'sample_students.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download Sample CSV
          </button>
          <div className="ui-field">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleBulkUpload}
              disabled={bulkLoading}
            />
          </div>
          {bulkLoading && <p style={{ color: "#3b82f6" }}>Uploading students...</p>}
          {bulkMsg && <p className="ui-msg ok">{bulkMsg}</p>}
          {bulkErr && <p className="ui-msg err">{bulkErr}</p>}
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
