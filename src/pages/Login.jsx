import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { redirectByRole } from "../utils/redirectByRole";
import { supabase } from "../services/supabase";
import "./Login.css";

export default function Login() {
  const { login, profile, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail === email && email) {
      setRememberMe(true);
    } else {
      setRememberMe(false);
    }
  }, [email]);

  useEffect(() => {
    if (loading) return;
    if (user && profile?.role) navigate(redirectByRole(profile.role), { replace: true });
  }, [loading, user, profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail === email) {
          localStorage.removeItem('rememberedEmail');
        }
      }
      await login(email, password);
      navigate("/post-login", { replace: true });
    } catch (error) {
      setErr(error.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setResetting(true);
    try {
      const emailToSend = resetEmail.trim();
      console.log('Sending reset email to:', emailToSend, 'Type:', typeof emailToSend);
      const { data, error } = await supabase.auth.resetPasswordForEmail(emailToSend, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      console.log('Response:', { data, error });
      if (error) throw error;
      setMsg("Password reset link sent to your email");
      setResetEmail("");
      setTimeout(() => setShowForgot(false), 2000);
    } catch (error) {
      console.error('Reset error:', error);
      setErr(error.message || "Failed to send reset email. Please check if the email exists.");
    } finally {
      setResetting(false);
    }
  };

  if (showForgot) {
    return (
      <div className="ui-center" style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)", minHeight: "100vh" }}>
        <div className="ui-auth" style={{ maxWidth: "420px" }}>
          <div className="ui-auth-brand" style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "700", color: "#fff", marginBottom: "8px" }}>Reset Password</h2>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>Enter your email to receive reset link</p>
          </div>
          <div className="ui-card" style={{ padding: "40px", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <form onSubmit={handleForgotPassword} className="ui-grid">
              <div className="ui-field">
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Email Address</label>
                <input
                  placeholder="you@school.com"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{ padding: "12px", fontSize: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
              </div>
              <button type="submit" className="ui-btn primary" disabled={resetting} style={{ padding: "12px", fontSize: "15px", fontWeight: "600", borderRadius: "8px" }}>
                {resetting ? "Sending..." : "Send Reset Link"}
              </button>
              <button type="button" className="ui-btn secondary" onClick={() => setShowForgot(false)} style={{ padding: "12px", fontSize: "15px", fontWeight: "600", borderRadius: "8px" }}>
                Back to Login
              </button>
              {msg && <p className="ui-msg ok" style={{ textAlign: "center", padding: "12px", borderRadius: "8px" }}>{msg}</p>}
              {err && <p className="ui-msg err" style={{ textAlign: "center", padding: "12px", borderRadius: "8px" }}>{err}</p>}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Left Side - Branding */}
      <div className="login-left">
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ margin: "0 auto 30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="/chronosphere-logo.png" alt="Chronosphere" style={{ width: "250px", height: "250px", objectFit: "contain", filter: "brightness(0) invert(1)" }} onError={(e) => e.target.style.display = 'none'} />
          </div>
          <h1 style={{ fontSize: "48px", fontWeight: "800", color: "#fff", marginBottom: "16px", letterSpacing: "-1px" }}>Student Portfolio</h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.9)", maxWidth: "400px", lineHeight: "1.6", margin: "0 auto" }}>Manage and showcase student achievements with our comprehensive portfolio management system</p>
          <div className="stats-container" style={{ marginTop: "40px", display: "flex", gap: "30px", justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div className="stat-number" style={{ fontSize: "32px", fontWeight: "700", color: "#fff" }}>500+</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Students</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="stat-number" style={{ fontSize: "32px", fontWeight: "700", color: "#fff" }}>50+</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Schools</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="stat-number" style={{ fontSize: "32px", fontWeight: "700", color: "#fff" }}>15+</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Themes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "700", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "8px" }}>Welcome Back</h2>
            <p style={{ fontSize: "15px", color: "#64748b" }}>Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>Email Address</label>
              <input
                type="email"
                placeholder="you@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "14px 16px", fontSize: "15px", border: "2px solid #e2e8f0", borderRadius: "10px", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "14px 16px", fontSize: "15px", border: "2px solid #e2e8f0", borderRadius: "10px", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b", cursor: "pointer" }}>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0ea5e9" }} />
                Remember me
              </label>
              {/* <button type="button" onClick={() => setShowForgot(true)} style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                Forgot Password?
              </button> */}
            </div>

            <button type="submit" style={{ width: "100%", padding: "14px", fontSize: "16px", fontWeight: "600", color: "#fff", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", border: "none", borderRadius: "10px", cursor: "pointer", transition: "transform 0.2s", boxShadow: "0 4px 12px rgba(14, 165, 233, 0.4)" }} onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"} onMouseOut={(e) => e.target.style.transform = "translateY(0)"}>
              Sign In
            </button>

            {err && <div style={{ padding: "12px 16px", background: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "14px", textAlign: "center" }}>{err}</div>}
          </form>

          <p style={{ marginTop: "30px", textAlign: "center", fontSize: "13px", color: "#94a3b8" }}>© 2024 Student Portfolio System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
