import { useState } from "react";
import { createUser } from "../services/adminApi";

export default function SuperAdminUsers() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const res = await createUser({
        email,
        password,
        full_name: fullName,
        role: "admin",
        school_id: schoolId,
      });
      setMsg(`Created: ${res.email} (${res.role})`);
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <div className="ui-page">
      <div className="ui-card" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h3>Create Admin</h3>
        <form onSubmit={submit} className="ui-grid">
          <div className="ui-field">
            <label>Full Name</label>
            <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="ui-field">
            <label>Email</label>
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="ui-field">
            <label>Password</label>
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="ui-field">
            <label>School ID</label>
            <input placeholder="School ID (optional)" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} />
          </div>
          <button className="ui-btn primary" type="submit">Create Admin</button>
          {msg && <p className="ui-msg ok">{msg}</p>}
          {err && <p className="ui-msg err">{err}</p>}
        </form>
      </div>
    </div>
  );
}
