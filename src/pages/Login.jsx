import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { redirectByRole } from "../utils/redirectByRole";

export default function Login() {
  const { login, profile, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (loading) return;
    if (user && profile?.role) navigate(redirectByRole(profile.role), { replace: true });
  }, [loading, user, profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      navigate("/post-login", { replace: true });
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div className="ui-center">
      <div className="ui-auth">
        <div className="ui-auth-brand">
          <h2>Student Portfolio</h2>
          {/* <p>Role-based dashboard for super admin, admin, and teacher.</p> */}
        </div>
        <div className="ui-card">
          <h3>Sign In</h3>
          <form onSubmit={handleSubmit} className="ui-grid">
            <div className="ui-field">
              <label>Email</label>
              <input
                placeholder="you@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="ui-field">
              <label>Password</label>
              <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="ui-btn primary">Login</button>
            {err && <p className="ui-msg err">{err}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
